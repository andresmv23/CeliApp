import psycopg2
import uvicorn
import os
import base64
from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.analizador import analisis_rapido
from app.servicios import obtener_producto_por_ean
from app.database import get_db_connection, guardar_producto
from app.ia_client import consultar_ia_experto_total, consultar_ia_vision_imagen
from app.schemas import (
    AnalisisRequest,
    AnalisisResponse,
    UserCreate,
    UserResponse,
    Token,
    PerfilResponse,
    ImagenAnalisisRequest,
    ImagenAnalisisResponse,
)
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    jwt,
    SECRET_KEY,
    ALGORITHM,
)

app = FastAPI(title="CeliApp API")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)


class FavoritoRequest(BaseModel):
    ean: str


# ── Auth helpers ──────────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido: falta sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    conn.close()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        conn.close()
        return user
    except Exception:
        return None


# ── Endpoints existentes (sin cambios) ───────────────────────────────────────

@app.get("/")
def root():
    return {"mensaje": "¡CeliApp Backend con Auth, IA y DB Persistente!"}


@app.post("/auth/register", response_model=UserResponse)
def registrar_usuario(user: UserCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a BD")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        hashed_pwd = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name) VALUES (%s, %s, %s) RETURNING id, email, full_name",
            (user.email, hashed_pwd, user.full_name),
        )
        new_user = cursor.fetchone()
        conn.commit()
        return new_user
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.post("/auth/login", response_model=Token)
def login_usuario(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
    user_db = cursor.fetchone()
    conn.close()
    if not user_db or not verify_password(form_data.password, user_db["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user_db["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me", response_model=UserResponse)
def leer_usuario_actual(current_user=Depends(get_current_user)):
    return current_user


@app.get("/users/perfil", response_model=PerfilResponse)
def obtener_perfil_completo(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute(
        """
        SELECT h.fecha, p.nombre, p.marca, p.ean, p.estado_gluten
        FROM historial_busquedas h
        JOIN productos p ON h.ean = p.ean
        WHERE h.user_id = %s
        ORDER BY h.fecha DESC
        LIMIT 10
        """,
        (current_user["id"],),
    )
    historial = cur.fetchall()
    cur.execute(
        """
        SELECT p.nombre, p.marca, p.ean, p.estado_gluten
        FROM favoritos f
        JOIN productos p ON f.ean = p.ean
        WHERE f.user_id = %s
        ORDER BY f.fecha DESC
        """,
        (current_user["id"],),
    )
    favoritos = cur.fetchall()
    conn.close()
    return {
        "usuario": {
            "id": current_user["id"],
            "email": current_user["email"],
            "full_name": current_user["full_name"],
        },
        "historial": historial,
        "favoritos": favoritos,
    }


@app.post("/favoritos")
def agregar_favorito(fav: FavoritoRequest, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO favoritos (user_id, ean) VALUES (%s, %s) ON CONFLICT (user_id, ean) DO NOTHING",
            (current_user["id"], fav.ean),
        )
        conn.commit()
        return {"mensaje": "Añadido a favoritos"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.delete("/favoritos/{ean}")
def eliminar_favorito(ean: str, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM favoritos WHERE user_id = %s AND ean = %s",
        (current_user["id"], ean),
    )
    conn.commit()
    conn.close()
    return {"mensaje": "Eliminado de favoritos"}


@app.post("/analizar", response_model=AnalisisResponse)
def analizar_ingredientes(request: AnalisisRequest):
    return analisis_rapido(request.ingredientes)


@app.get("/producto/{ean}")
@limiter.limit("10/minute")
def buscar_producto_inteligente(
    request: Request,
    ean: str,
    current_user=Depends(get_optional_user),
):
    def guardar_en_historial(ean_encontrado):
        if not current_user:
            return
        try:
            c = get_db_connection()
            cur = c.cursor()
            cur.execute(
                "INSERT INTO historial_busquedas (user_id, ean) VALUES (%s, %s)",
                (current_user["id"], ean_encontrado),
            )
            c.commit()
            c.close()
        except Exception as ex:
            print(f"\n❌ Error guardando historial: {ex}")

    # 1. BD local
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM productos WHERE ean = %s", (ean,))
            producto_db = cur.fetchone()
            cur.close()
            conn.close()
            if producto_db:
                print(f"\n✅ [CACHE HIT] Producto {ean} encontrado en DB Local.")
                guardar_en_historial(ean)
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
        except Exception as e:
            print(f"\n❌ Error leyendo DB Local: {e}")

    # 2. OpenFoodFacts
    print(f"\n🔍 [CACHE MISS] Buscando {ean} en OpenFoodFacts...")
    resultado_off = obtener_producto_por_ean(ean)
    ingredientes_off = resultado_off.get("ingredientes", "")
    off_es_valido = (
        resultado_off["encontrado"]
        and ingredientes_off
        and len(ingredientes_off.strip()) > 5
    )

    if off_es_valido:
        diagnostico = analisis_rapido(ingredientes_off)
        analisis_final = diagnostico
        fuente_final = "OFICIAL"
        if diagnostico.get("modo_ia") == "VALIDACION_OFICIAL":
            print("\n🌐 OFF Limpio -> Validando certificado con IA Web...")
            datos_ia_web = consultar_ia_experto_total(ean, resultado_off.get("nombre", ""))
            analisis_final = {
                "es_apto": datos_ia_web.get("es_apto"),
                "motivo": datos_ia_web.get("justificacion"),
                "necesita_ia": False,
                "estado": datos_ia_web.get("estado"),
                "confianza": datos_ia_web.get("confianza"),
            }
            fuente_final = "OFF_VALIDADO_IA"

        guardar_producto(
            ean=ean,
            datos_producto=resultado_off,
            analisis_result=analisis_final,
            fuente_datos=fuente_final,
        )
        guardar_en_historial(ean)
        return {
            "fuente": "OPEN_FOOD_FACTS",
            "producto": resultado_off,
            "analisis": analisis_final,
        }

    # 3. IA Deep Search
    print(f"\n🧠 [DEEP SEARCH] Invocando IA para {ean}...")
    nombre_pista = resultado_off.get("nombre", "") if resultado_off["encontrado"] else ""
    datos_ia = consultar_ia_experto_total(ean, nombre_pista)

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
        guardar_en_historial(ean)
        return {
            "fuente": "IA_PERPLEXITY",
            "producto": datos_ia,
            "analisis": analisis_ia,
        }

    return {
        "fuente": "NO_ENCONTRADO",
        "producto": {
            "nombre": "Producto no identificado",
            "marca": "Desconocida",
            "ingredientes": "No se encontraron ingredientes para este código EAN.",
        },
        "analisis": {
            "es_apto": False,
            "necesita_ia": False,
            "motivo": "Este producto no está en ninguna base de datos conocida. Por seguridad, asume que NO es apto para celíacos.",
            "estado": "NO_APTO",
            "confianza": "baja",
        },
    }


# Endpoint: análisis por imagen

@app.post("/analizar-imagen", response_model=ImagenAnalisisResponse)
@limiter.limit("5/minute")
def analizar_producto_por_imagen(
    request: Request,
    body: ImagenAnalisisRequest,
    current_user=Depends(get_optional_user),
):
    """
    Recibe una foto del producto en base64 y el EAN de referencia.
    Usa sonar-pro de Perplexity que soporta imágenes de forma nativa.
    Rate limit: 5/minuto (sonar-pro es más caro que sonar).
    """

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

    # Llamar a sonar-pro con la imagen
    datos_vision = consultar_ia_vision_imagen(body.imagen_base64, ean_ref)

    nombre       = datos_vision.get("nombre") or "Producto analizado por imagen"
    marca        = datos_vision.get("marca") or "Desconocida"
    ingredientes = datos_vision.get("ingredientes")
    imagen_url   = datos_vision.get("imagen_url")
    es_apto      = datos_vision.get("es_apto", False)
    estado       = datos_vision.get("estado", "DUDOSO")
    motivo       = datos_vision.get("justificacion", "Sin información")
    confianza    = datos_vision.get("confianza", "baja")
    encontrado   = datos_vision.get("encontrado", False)
    analizado_por = datos_vision.get("analizado_por", "vision")

    # Si sonar-pro leyó ingredientes, pasar también por el analizador rápido
    # para mantener consistencia con el flujo de OpenFoodFacts
    if ingredientes and len(ingredientes.strip()) > 5:
        diagnostico_rapido = analisis_rapido(ingredientes)
        if diagnostico_rapido.get("estado") == "NO_APTO":
            es_apto   = False
            estado    = "NO_APTO"
            motivo    = diagnostico_rapido.get("motivo", motivo)
            confianza = "alta"

    analisis_final = {
        "es_apto":      es_apto,
        "estado":       estado,
        "motivo":       motivo,
        "confianza":    confianza,
        "analizado_por": analizado_por,
    }

    # Guardar en BD si hay datos suficientes
    if encontrado and ean_ref:
        try:
            guardar_producto(
                ean=ean_ref,
                datos_producto={
                    "encontrado":  True,
                    "nombre":      nombre,
                    "marca":       marca,
                    "ingredientes": ingredientes or "",
                    "imagen_url":  imagen_url,
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

    # Guardar historial
    if current_user and ean_ref:
        try:
            c = get_db_connection()
            cur = c.cursor()
            cur.execute(
                "INSERT INTO historial_busquedas (user_id, ean) VALUES (%s, %s)",
                (current_user["id"], ean_ref),
            )
            c.commit()
            c.close()
        except Exception as ex:
            print(f"\n⚠️  Error guardando historial visión: {ex}")

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


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)