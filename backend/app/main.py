import psycopg2
import uvicorn
import os
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from psycopg2.extras import RealDictCursor
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from fastapi import Request
from typing import Optional
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.analizador import analisis_rapido
from app.servicios import obtener_producto_por_ean
from app.database import get_db_connection, guardar_producto
from app.ia_client import consultar_ia_experto_total
from app.schemas import (
    AnalisisRequest,
    AnalisisResponse,
    UserCreate,
    UserResponse,
    Token,
    PerfilResponse,
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
    allow_methods=["*"],
    allow_headers=["*"],
)


class FavoritoRequest(BaseModel):
    ean: str


# Esto nos permite proteger rutas y saber quién es el usuario en una sola línea
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
        return None  # Es un usuario anónimo
    try:
        # Reutilizamos tu lógica, pero si falla, no rompemos la app, lo tratamos como anónimo
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

    if not user_db or not verify_password(
        form_data.password, user_db["hashed_password"]
    ):
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
        # ON CONFLICT DO NOTHING evita error si ya es favorito
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
    """
    Flujo Maestro: DB Local -> OpenFoodFacts -> IA Deep Search
    NOTA: Soporta usuarios anónimos (current_user = None)
    """

    def guardar_en_historial(ean_encontrado):
        if not current_user:
            # Si es invitado, no guardamos historial
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
            print(f"⚠️ Error guardando historial: {ex}")

    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT * FROM productos WHERE ean = %s", (ean,))
            producto_db = cur.fetchone()
            cur.close()
            conn.close()

            if producto_db:
                print(f"✅ [CACHE HIT] Producto {ean} encontrado en DB Local.")
                guardar_en_historial(ean)
                return {
                    "fuente": "BASE_DE_DATOS_PROPIA",
                    "producto": {
                        "nombre": producto_db["nombre"],
                        "marca": producto_db["marca"],
                        "ingredientes": producto_db["ingredientes"],
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
            print(f"⚠️ Error leyendo DB Local: {e}")

    print(f"🌍 [CACHE MISS] Buscando {ean} en OpenFoodFacts...")
    resultado_off = obtener_producto_por_ean(ean)
    # print(resultado_off)

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
            print("🕵️ OFF Limpio -> Validando certificado con IA Web...")
            datos_ia_web = consultar_ia_experto_total(
                ean, resultado_off.get("nombre", "")
            )

            analisis_final = {
                "es_apto": datos_ia_web.get("es_apto"),
                "motivo": datos_ia_web.get("justificacion"),
                "necesita_ia": False,
                "estado": datos_ia_web.get("estado"),
                "confianza": datos_ia_web.get("confianza"),
            }
            fuente_final = "OFF_VALIDADO_IA"

        print(f"💾 Guardando hallazgo ({fuente_final}) en DB...")
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

    else:
        if resultado_off["encontrado"]:
            print(f"⚠️ OFF encontró el producto pero SIN ingredientes. Saltando a IA...")

    print(
        f"🤖 [DEEP SEARCH] Producto desconocido/incompleto en OFF. Invocando IA para {ean}..."
    )

    nombre_pista = (
        resultado_off.get("nombre", "") if resultado_off["encontrado"] else ""
    )

    datos_ia = consultar_ia_experto_total(ean, nombre_pista)

    if datos_ia.get("encontrado"):
        analisis_ia = {
            "es_apto": datos_ia.get("es_apto"),
            "motivo": datos_ia.get("justificacion"),
            "necesita_ia": False,
            "estado": datos_ia.get("estado"),
            "confianza": datos_ia.get("confianza", "media"),
        }

        print(f"💾 Guardando investigación de IA en DB...")
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
            "ingredientes": "No se encontraron ingredientes para este código EAN."
        },
        "analisis": {
            "es_apto": False,
            "necesita_ia": False,
            "motivo": "Este producto no está en ninguna base de datos conocida. Por seguridad, asume que NO es apto para celíacos.",
            "estado": "NO_APTO",
            "confianza": "baja"
        }
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
