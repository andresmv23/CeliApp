import base64
from fastapi import APIRouter, HTTPException, Depends, Request
from psycopg2.extras import RealDictCursor

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.database import get_db_connection, release_connection, guardar_producto
from app.analizador import analisis_rapido
from app.servicios import obtener_producto_por_ean
from app.ia_client import consultar_ia_experto_total, consultar_ia_vision_imagen
from app.schemas import AnalisisRequest, AnalisisResponse, ImagenAnalisisRequest, ImagenAnalisisResponse
from app.routers.auth import get_optional_user

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# ── Helper ────────────────────────────────────────────────────────────────────

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


def _analisis_desde_gluten_off(gluten_segun_off: str) -> dict:
    """Convierte el valor de gluten_segun_off en un bloque de análisis final."""
    if gluten_segun_off == "SIN_GLUTEN":
        return {
            "es_apto": True,
            "necesita_ia": False,
            "estado": "APTO",
            "motivo": "Open Food Facts declara explícitamente que este producto no contiene gluten.",
            "confianza": "alta",
        }
    else:  # CON_GLUTEN
        return {
            "es_apto": False,
            "necesita_ia": False,
            "estado": "NO_APTO",
            "motivo": "Open Food Facts confirma que este producto contiene gluten o trazas declaradas.",
            "confianza": "alta",
        }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/analizar", response_model=AnalisisResponse)
def analizar_ingredientes(request: AnalisisRequest):
    return analisis_rapido(request.ingredientes)


@router.get("/producto/{ean}")
@limiter.limit("10/minute")
def buscar_producto_inteligente(
    request: Request,
    ean: str,
    current_user=Depends(get_optional_user),
):
    # 1. BD local
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM productos WHERE ean = %s", (ean,))
            producto_db = cur.fetchone()
        finally:
            release_connection(conn)

        if producto_db:
            print(f"\n✅ [CACHE HIT] Producto {ean} encontrado en DB Local.")
            if current_user:
                guardar_en_historial(current_user["id"], ean)
            return {
                "fuente": "BASE_DE_DATOS_PROPIA",
                "producto": {
                    "nombre": producto_db["nombre"],
                    "marca": producto_db["marca"],
                    "ingredientes": producto_db["ingredientes"],
                    "imagen_url": producto_db["imagen_url"],
                },
                "analisis": {
                    "es_apto": producto_db["estado_gluten"] == "APTO",
                    "necesita_ia": producto_db["estado_gluten"] == "DUDOSO",
                    "motivo": producto_db["justificacion"],
                    "estado": producto_db["estado_gluten"],
                    "confianza": "alta",
                },
            }

    # 2. Open Food Facts
    print(f"\n🔍 [CACHE MISS] Buscando {ean} en OpenFoodFacts...")
    resultado_off = obtener_producto_por_ean(ean)
    gluten_off = resultado_off.get("gluten_segun_off")  # 'SIN_GLUTEN' | 'CON_GLUTEN' | None

    if resultado_off["encontrado"]:

        # 2a. OFF tiene datos de gluten → usar directamente, sin IA
        if gluten_off is not None:
            print(f"\n✅ [OFF GLUTEN DATA] Estado gluten según OFF: {gluten_off}")
            analisis_final = _analisis_desde_gluten_off(gluten_off)
            guardar_producto(
                ean=ean,
                datos_producto=resultado_off,
                analisis_result=analisis_final,
                fuente_datos="OFF_DIRECTO",
            )
            if current_user:
                guardar_en_historial(current_user["id"], ean)
            return {
                "fuente": "OPEN_FOOD_FACTS",
                "producto": resultado_off,
                "analisis": analisis_final,
            }

        # 2b. OFF encontró el producto pero no tiene datos de gluten → IA busca por EAN+nombre+marca
        print(f"\n🌐 [OFF SIN GLUTEN DATA] Delegando a IA para {ean}...")
        nombre_pista = resultado_off.get("nombre", "")
        marca_pista = resultado_off.get("marca", "")
        datos_ia = consultar_ia_experto_total(ean, nombre_pista, marca_pista)

        if datos_ia.get("encontrado"):
            analisis_ia = {
                "es_apto": datos_ia.get("es_apto"),
                "motivo": datos_ia.get("justificacion"),
                "necesita_ia": False,
                "estado": datos_ia.get("estado"),
                "confianza": datos_ia.get("confianza", "media"),
            }
            # Fusionar OFF + IA: OFF es la base, IA rellena lo que OFF no tiene
            producto_fusionado = {
                **resultado_off,
                "ingredientes": resultado_off.get("ingredientes") or datos_ia.get("ingredientes") or "",
                "imagen_url": resultado_off.get("imagen_url") or datos_ia.get("imagen_url") or "",
                "nombre": resultado_off.get("nombre") or datos_ia.get("nombre") or "Desconocido",
                "marca": resultado_off.get("marca") or datos_ia.get("marca") or "Marca desconocida",
            }
            guardar_producto(
                ean=ean,
                datos_producto=producto_fusionado,
                analisis_result=analisis_ia,
                fuente_datos="OFF_VALIDADO_IA",
            )
            if current_user:
                guardar_en_historial(current_user["id"], ean)
            return {
                "fuente": "OFF_VALIDADO_IA",
                "producto": producto_fusionado,
                "analisis": analisis_ia,
            }

        # IA no encontró nada concreto → DUDOSO, no inventar
        analisis_dudoso = {
            "es_apto": False,
            "necesita_ia": False,
            "estado": "DUDOSO",
            "motivo": "No se encontró información específica sobre gluten para este producto. Consulta el etiquetado físico.",
            "confianza": "baja",
        }
        guardar_producto(
            ean=ean,
            datos_producto=resultado_off,
            analisis_result=analisis_dudoso,
            fuente_datos="OFF_SIN_DATOS_GLUTEN",
        )
        if current_user:
            guardar_en_historial(current_user["id"], ean)
        return {
            "fuente": "OPEN_FOOD_FACTS",
            "producto": resultado_off,
            "analisis": analisis_dudoso,
        }

    # 3. OFF no encontró el producto → IA Deep Search por EAN
    print(f"\n🧠 [DEEP SEARCH] OFF no encontró {ean}, invocando IA...")
    datos_ia = consultar_ia_experto_total(ean, "", "")

    if datos_ia.get("encontrado"):
        analisis_ia = {
            "es_apto": datos_ia.get("es_apto"),
            "motivo": datos_ia.get("justificacion"),
            "necesita_ia": False,
            "estado": datos_ia.get("estado"),
            "confianza": datos_ia.get("confianza", "media"),
        }
        guardar_producto(
            ean=ean,
            datos_producto=datos_ia,
            analisis_result=analisis_ia,
            fuente_datos="IA_GENERADA",
        )
        if current_user:
            guardar_en_historial(current_user["id"], ean)
        return {
            "fuente": "IA_PERPLEXITY",
            "producto": datos_ia,
            "analisis": analisis_ia,
        }

    # Nadie encontró nada → DUDOSO (nunca NO_APTO por defecto)
    return {
        "fuente": "NO_ENCONTRADO",
        "producto": {
            "nombre": "Producto no identificado",
            "marca": "Desconocida",
            "ingredientes": None,
            "imagen_url": None,
        },
        "analisis": {
            "es_apto": False,
            "necesita_ia": False,
            "motivo": "No se encontró este producto en ninguna fuente. Consulta el etiquetado físico del envase.",
            "estado": "DUDOSO",
            "confianza": "baja",
        },
    }


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

    nombre        = datos_vision.get("nombre") or "Producto analizado por imagen"
    marca         = datos_vision.get("marca") or "Desconocida"
    ingredientes  = datos_vision.get("ingredientes")
    imagen_url    = datos_vision.get("imagen_url")
    es_apto       = datos_vision.get("es_apto", False)
    estado        = datos_vision.get("estado", "DUDOSO")
    motivo        = datos_vision.get("justificacion", "Sin información")
    confianza     = datos_vision.get("confianza", "baja")
    encontrado    = datos_vision.get("encontrado", False)
    analizado_por = datos_vision.get("analizado_por", "vision")

    if ingredientes and len(ingredientes.strip()) > 5:
        diagnostico_rapido = analisis_rapido(ingredientes)
        if diagnostico_rapido.get("estado") == "NO_APTO":
            es_apto   = False
            estado    = "NO_APTO"
            motivo    = diagnostico_rapido.get("motivo", motivo)
            confianza = "alta"

    analisis_final = {
        "es_apto":        es_apto,
        "estado":         estado,
        "motivo":         motivo,
        "confianza":      confianza,
        "analizado_por":  analizado_por,
    }

    if encontrado and ean_ref:
        try:
            guardar_producto(
                ean=ean_ref,
                datos_producto={
                    "encontrado":   True,
                    "nombre":       nombre,
                    "marca":        marca,
                    "ingredientes": ingredientes or "",
                    "imagen_url":   imagen_url,
                },
                analisis_result={
                    "es_apto":     es_apto,
                    "motivo":      motivo,
                    "necesita_ia": False,
                    "estado":      estado,
                    "confianza":   confianza,
                },
                fuente_datos="IA_VISION",
            )
            print(f"\n💾 Guardado en BD desde visión: {nombre}")
        except Exception as e:
            print(f"\n⚠️  No se pudo guardar en BD: {e}")

    if current_user and ean_ref:
        guardar_en_historial(current_user["id"], ean_ref)

    return {
        "fuente": "IA_VISION",
        "producto": {
            "nombre":       nombre,
            "marca":        marca,
            "ingredientes": ingredientes,
            "imagen_url":   imagen_url,
        },
        "analisis": analisis_final,
    }
