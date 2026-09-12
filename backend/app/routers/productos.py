import base64
from fastapi import APIRouter, HTTPException, Depends, Request
from psycopg2.extras import RealDictCursor

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import (
    get_db_connection,
    release_connection,
    guardar_producto,
)

from app.analizador import (
    analisis_rapido,
    analizar_ingredientes_basico,
)

from app.servicios import obtener_producto_por_ean

from app.schemas import (
    AnalisisRequest,
    AnalisisResponse,
    ImagenAnalisisRequest,
    ImagenAnalisisResponse,
    Producto,
    Analisis,
    ProductoAnalizado,
)

from app.routers.auth import get_optional_user

from app.ia_client import (
    consultar_ia_vision_imagen,
    encontrar_ingredientes_producto,
    encontrar_imagen_producto,
    buscar_producto_similar_por_ean,
    verificar_gluten_web,
)

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ── Helpers ───────────────────────────────────────────────────────────────────────

def guardar_en_historial(user_id: int, ean: str) -> None:
    conn = get_db_connection()
    if not conn:
        return
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO historial_busquedas (user_id, ean) VALUES (%s, %s)",
            (user_id, ean),
        )
        conn.commit()
    except Exception as ex:
        conn.rollback()
        print(f"\n❌ Error guardando historial: {ex}")
    finally:
        release_connection(conn)


def _enriquecer_producto(producto: Producto) -> Producto:
    """
    Completa ingredientes e imagen mediante IA cuando OFF o la búsqueda web
    ha identificado el nombre y la marca, pero faltan esos datos.
    """
    nombre = (producto.nombre or "").strip()
    marca = (producto.marca or "").strip()

    if not nombre or not marca:
        return producto

    ingredientes = producto.ingredientes or ""
    imagen_url = producto.imagen_url or ""

    if not ingredientes.strip():
        print(f"\n🧾 [ENRIQUECER] Buscando ingredientes: {marca} - {nombre}")
        ingredientes_encontrados = encontrar_ingredientes_producto(nombre, marca)

        if ingredientes_encontrados:
            ingredientes = ingredientes_encontrados

    if not imagen_url.strip():
        print(f"\n🖼️ [ENRIQUECER] Buscando imagen: {marca} - {nombre}")
        imagen_encontrada = encontrar_imagen_producto(nombre, marca)

        if imagen_encontrada:
            imagen_url = imagen_encontrada

    return Producto(
        ean=producto.ean,
        nombre=producto.nombre,
        marca=producto.marca,
        ingredientes=ingredientes,
        trazas_declaradas=producto.trazas_declaradas,
        imagen_url=imagen_url,
    )


# ── Endpoints ────────────────────────────────────────────────────────────────────

@router.post("/analizar", response_model=AnalisisResponse)
def analizar_ingredientes(request: AnalisisRequest):
    return analisis_rapido(request.ingredientes)


@router.get("/producto/{ean}", response_model=ProductoAnalizado)
@limiter.limit("10/minute")
def buscar_producto_inteligente(
    request: Request,
    ean: str,
    current_user=Depends(get_optional_user),
) -> ProductoAnalizado:
    # 1. BD local (caché)
    conn = get_db_connection()

    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM productos WHERE ean = %s", (ean,))
            producto_db = cur.fetchone()
        finally:
            release_connection(conn)

        if producto_db:
            print(f"\n✅ [CACHE HIT] Producto {ean} encontrado en BD local.")

            estado_db = producto_db["estado_gluten"] or "DUDOSO"
            if estado_db not in {"APTO", "NO_APTO", "TRAZAS", "DUDOSO"}:
                estado_db = "DUDOSO"

            fuente_db = producto_db["tipo_fuente"] or "BD_LOCAL"
            fuentes_validas = {
                "BD_LOCAL",
                "OPEN_FOOD_FACTS",
                "ANALISIS_INGREDIENTES",
                "WEB_FABRICANTE",
                "WEB_TERCEROS",
                "SIN_FUENTE_CONFIRMADA",
            }
            if fuente_db not in fuentes_validas:
                fuente_db = "BD_LOCAL"

            resultado = ProductoAnalizado(
                producto=Producto(
                    ean=ean,
                    nombre=producto_db["nombre"],
                    marca=producto_db["marca"],
                    ingredientes=producto_db["ingredientes"],
                    imagen_url=producto_db["imagen_url"],
                    trazas_declaradas=None,
                ),
                analisis=Analisis(
                    es_apto=estado_db == "APTO",
                    estado=estado_db,
                    motivo=producto_db["justificacion"]
                    or "Resultado recuperado de la base de datos local.",
                    url_info=producto_db["url_fuente"],
                    fuente=fuente_db,
                    confianza="alta",
                ),
            )

            if current_user:
                guardar_en_historial(current_user["id"], ean)

            return resultado

    # 2. Open Food Facts
    print(f"\n🔍 [CACHE MISS] Buscando {ean} en Open Food Facts...")
    resultado_off = obtener_producto_por_ean(ean)

    if resultado_off.encontrado:
        producto = Producto(
            ean=ean,
            nombre=resultado_off.nombre,
            marca=resultado_off.marca,
            ingredientes=resultado_off.ingredientes,
            trazas_declaradas=resultado_off.trazas_declaradas,
            imagen_url=resultado_off.imagen_url,
        )

        # 2a. OFF ofrece una declaración explícita
        if resultado_off.gluten_segun_off == "SIN_GLUTEN":
            analisis = Analisis(
                es_apto=True,
                estado="APTO",
                motivo=(
                    "Open Food Facts declara explícitamente que este producto "
                    "es sin gluten."
                ),
                url_info=resultado_off.url_fuente,
                fuente="OPEN_FOOD_FACTS",
                confianza="alta",
            )

            resultado = ProductoAnalizado(
                producto=producto,
                analisis=analisis,
            )

            guardar_producto(resultado)

            if current_user:
                guardar_en_historial(current_user["id"], ean)

            return resultado

        if resultado_off.gluten_segun_off == "CON_GLUTEN":
            analisis = Analisis(
                es_apto=False,
                estado="NO_APTO",
                motivo=(
                    "Open Food Facts declara gluten o cereales con gluten "
                    "entre los alérgenos del producto."
                ),
                url_info=resultado_off.url_fuente,
                fuente="OPEN_FOOD_FACTS",
                confianza="alta",
            )

            resultado = ProductoAnalizado(
                producto=producto,
                analisis=analisis,
            )

            guardar_producto(resultado)

            if current_user:
                guardar_en_historial(current_user["id"], ean)

            return resultado

        if resultado_off.gluten_segun_off == "TRAZAS":
            analisis = Analisis(
                es_apto=False,
                estado="TRAZAS",
                motivo=(
                    "Open Food Facts declara posibles trazas de gluten "
                    "o cereales con gluten."
                ),
                url_info=resultado_off.url_fuente,
                fuente="OPEN_FOOD_FACTS",
                confianza="alta",
            )

            resultado = ProductoAnalizado(
                producto=producto,
                analisis=analisis,
            )

            guardar_producto(resultado)

            if current_user:
                guardar_en_historial(current_user["id"], ean)

            return resultado

        producto = _enriquecer_producto(producto)

        # 2b. OFF no tiene información concluyente: ingredientes
        analisis = analizar_ingredientes_basico(
            producto.ingredientes or ""
        )

        if analisis.estado == "NO_APTO":
            resultado = ProductoAnalizado(
                producto=producto,
                analisis=analisis,
            )

            guardar_producto(resultado)

            if current_user:
                guardar_en_historial(current_user["id"], ean)

            return resultado

        # 2c. OFF identificó el producto, pero falta verificación
        print(f"\n[IA] Verificando gluten del producto OFF {ean}...")
        analisis = verificar_gluten_web(producto)

        resultado = ProductoAnalizado(
            producto=producto,
            analisis=analisis,
        )

        guardar_producto(resultado)

        if current_user:
            guardar_en_historial(current_user["id"], ean)

        return resultado

    # 3. OFF no encuentra el producto:
    # buscar una referencia/candidato desde el EAN en Internet.
    print(f"\n[IA] OFF no encontró {ean}; buscando referencias web...")
    producto = buscar_producto_similar_por_ean(ean)

    if producto is not None:
        # El candidato se analiza por separado; no se asume que sea apto.
        producto = _enriquecer_producto(producto)
        analisis = verificar_gluten_web(producto)

        resultado = ProductoAnalizado(
            producto=producto,
            analisis=analisis,
        )

        guardar_producto(resultado)

        if current_user:
            guardar_en_historial(current_user["id"], ean)

        return resultado
    
    # 4. Ninguna fuente encontró el producto
    resultado = ProductoAnalizado(
        producto=Producto(
            ean=ean,
            nombre="Producto no identificado",
            marca="Desconocida",
            ingredientes=None,
            imagen_url=None,
            trazas_declaradas=None,
        ),
        analisis=Analisis(
            es_apto=False,
            estado="DUDOSO",
            motivo=(
                "No se encontró este producto en Open Food Facts ni información "
                "verificada mediante búsqueda web. Consulta el etiquetado físico."
            ),
            url_info=None,
            fuente="SIN_FUENTE_CONFIRMADA",
            confianza="baja",
        ),
    )

    if current_user:
        guardar_en_historial(current_user["id"], ean)

    return resultado


@router.post("/analizar-imagen", response_model=ImagenAnalisisResponse)
@limiter.limit("5/minute")
def analizar_producto_por_imagen(
    request: Request,
    body: ImagenAnalisisRequest,
    current_user=Depends(get_optional_user),
):
    MAX_BASE64_LEN = 6_500_000
    if len(body.imagen_base64) > MAX_BASE64_LEN:
        raise HTTPException(
            status_code=413,
            detail="La imagen es demasiado grande. Máximo 5 MB. Reduce la resolución e inténtalo de nuevo.",
        )

    try:
        decoded = base64.b64decode(body.imagen_base64, validate=True)
        if len(decoded) < 1000:
            raise HTTPException(
                status_code=400,
                detail="La imagen recibida está vacía o corrupta.",
            )
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="El formato de imagen no es válido. Envía base64 puro sin prefijo data:image/...",
        )

    ean_ref = body.ean.strip() if body.ean else ""
    print(f"\n📷 POST /analizar-imagen | EAN ref: '{ean_ref}' | Tamaño: {len(body.imagen_base64)} chars")

    datos_vision = consultar_ia_vision_imagen(body.imagen_base64, ean_ref)

    nombre = datos_vision.get("nombre") or "Producto analizado por imagen"
    marca = datos_vision.get("marca") or "Desconocida"
    ingredientes = datos_vision.get("ingredientes")
    imagen_url = datos_vision.get("imagen_url")
    es_apto = datos_vision.get("es_apto", False)
    estado = datos_vision.get("estado", "DUDOSO")
    motivo = datos_vision.get("justificacion", "Sin información")
    confianza = datos_vision.get("confianza", "baja")
    encontrado = datos_vision.get("encontrado", False)
    analizado_por = datos_vision.get("analizado_por", "vision")

    if ingredientes and len(ingredientes.strip()) > 5:
        diagnostico_rapido = analisis_rapido(ingredientes)
        if diagnostico_rapido.get("estado") == "NO_APTO":
            es_apto = False
            estado = "NO_APTO"
            motivo = diagnostico_rapido.get("motivo", motivo)
            confianza = "alta"

    # Enriquecer imagen si la visión no la encontró
    if not imagen_url:
        imagen_url = encontrar_imagen_producto(nombre, marca)

    analisis_final = {
        "es_apto": es_apto,
        "estado": estado,
        "motivo": motivo,
        "confianza": confianza,
        "analizado_por": analizado_por,
    }

    if encontrado and ean_ref:
        try:
            guardar_producto(
                ean=ean_ref,
                datos_producto={
                    "encontrado": True,
                    "nombre": nombre,
                    "marca": marca,
                    "ingredientes": ingredientes or "",
                    "imagen_url": imagen_url,
                    "url_fuente": datos_vision.get("url_fuente"),
                },
                analisis_result={
                    "es_apto": es_apto,
                    "motivo": motivo,
                    "necesita_ia": False,
                    "estado": estado,
                    "confianza": confianza,
                },
                fuente_datos="IA_VISION",
            )
            print(f"\n💾 Guardado en BD desde visión: {nombre}")
        except Exception as e:
            print(f"\n⚠️ No se pudo guardar en BD: {e}")

    if current_user and ean_ref:
        guardar_en_historial(current_user["id"], ean_ref)

    return {
        "fuente": "IA_VISION",
        "producto": {
            "nombre": nombre,
            "marca": marca,
            "ingredientes": ingredientes,
            "imagen_url": imagen_url,
        },
        "analisis": analisis_final,
    }
