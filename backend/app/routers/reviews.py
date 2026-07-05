from fastapi import APIRouter, HTTPException, Header
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.database import get_db_connection, release_connection
from app.auth import verificar_token

router = APIRouter()


class ReviewCreate(BaseModel):
    nombre: Optional[str] = None      # obligatorio si no está logueado
    ciudad: Optional[str] = None
    email: Optional[EmailStr] = None  # obligatorio si no está logueado
    texto: str
    estrellas: int


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
    authorization: Optional[str] = Header(None),
):
    """Envía una nueva review. Queda en estado pendiente hasta que el admin la apruebe."""

    # Determinar si el usuario está logueado
    user_id = None
    nombre_final = body.nombre
    ciudad_final = body.ciudad
    email_final = body.email

    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
        try:
            payload = verificar_token(token)
            user_id = payload.get("sub")
        except Exception:
            raise HTTPException(status_code=401, detail="Token inválido")

    # Validaciones según si está logueado o no
    if user_id:
        # Usuario logueado: obtenemos nombre y email de su perfil
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT full_name, email FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
        finally:
            release_connection(conn)
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
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
