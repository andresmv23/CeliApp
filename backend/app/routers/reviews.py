from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.security import OAuth2PasswordBearer
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database import get_db_connection, release_connection
from app.auth import jwt, SECRET_KEY, ALGORITHM

router = APIRouter()

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


class ReviewCreate(BaseModel):
    nombre: Optional[str] = None
    ciudad: Optional[str] = None
    email: Optional[EmailStr] = None
    texto: str
    estrellas: int


def _get_user_from_token(token: Optional[str]) -> Optional[dict]:
    """Devuelve el usuario de BD si el token es válido, o None si no hay sesión."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
            return cur.fetchone()
        finally:
            release_connection(conn)
    except Exception:
        return None


@router.get("/reviews")
def listar_reviews_aprobadas():
    """Devuelve solo las reviews aprobadas para mostrar en la web pública."""
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("""
            SELECT id, nombre, ciudad, texto, estrellas, created_at
            FROM reviews
            WHERE estado = 'aprobada'
            ORDER BY created_at DESC
        """)
        return cur.fetchall()
    finally:
        release_connection(conn)


@router.post("/reviews", status_code=201)
def crear_review(
    body: ReviewCreate,
    token: Optional[str] = Depends(oauth2_scheme_optional),
):
    """Envía una nueva review. Queda en estado pendiente hasta que el admin la apruebe."""

    user = _get_user_from_token(token)

    nombre_final = body.nombre
    ciudad_final = body.ciudad
    email_final = body.email
    user_id = None

    if user:
        # Usuario logueado: usamos sus datos del perfil
        user_id = user["id"]
        nombre_final = user["full_name"] or nombre_final or "Usuario"
        email_final = user["email"]
    else:
        # Usuario anónimo: nombre y email son obligatorios
        if not nombre_final or not nombre_final.strip():
            raise HTTPException(status_code=422, detail="El nombre es obligatorio")
        if not email_final:
            raise HTTPException(status_code=422, detail="El email es obligatorio si no estás registrado")

    if not body.texto or not body.texto.strip():
        raise HTTPException(status_code=422, detail="El texto de la reseña no puede estar vacío")
    if not (1 <= body.estrellas <= 5):
        raise HTTPException(status_code=422, detail="Las estrellas deben estar entre 1 y 5")

    conn = get_db_connection()
    try:
        cur = conn.cursor()

        # Anti-duplicados: misma cuenta o mismo email con review pendiente/aprobada
        if user_id:
            cur.execute("""
                SELECT id FROM reviews
                WHERE user_id = %s AND estado IN ('pendiente', 'aprobada')
            """, (user_id,))
        else:
            cur.execute("""
                SELECT id FROM reviews
                WHERE email = %s AND estado IN ('pendiente', 'aprobada')
            """, (str(email_final),))

        if cur.fetchone():
            raise HTTPException(
                status_code=409,
                detail="Ya tienes una reseña enviada o publicada. ¡Gracias por tu participación!"
            )

        cur.execute("""
            INSERT INTO reviews (user_id, nombre, ciudad, email, texto, estrellas, estado)
            VALUES (%s, %s, %s, %s, %s, %s, 'pendiente')
        """, (
            user_id,
            nombre_final.strip(),
            ciudad_final.strip() if ciudad_final else None,
            str(email_final) if email_final else None,
            body.texto.strip(),
            body.estrellas,
        ))
        conn.commit()
        return {"ok": True, "mensaje": "Tu reseña ha sido enviada y está pendiente de revisión. ¡Gracias!"}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)
