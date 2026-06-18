from fastapi import APIRouter, HTTPException, Depends
from psycopg2.extras import RealDictCursor
from pydantic import BaseModel

from app.database import get_db_connection, release_connection
from app.schemas import PerfilResponse
from app.routers.auth import get_current_user

router = APIRouter()


class FavoritoRequest(BaseModel):
    ean: str


@router.post("/favoritos")
def agregar_favorito(fav: FavoritoRequest, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
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
        release_connection(conn)


@router.delete("/favoritos/{ean}")
def eliminar_favorito(ean: str, current_user=Depends(get_current_user)):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "DELETE FROM favoritos WHERE user_id = %s AND ean = %s",
            (current_user["id"], ean),
        )
        conn.commit()
    finally:
        release_connection(conn)
    return {"mensaje": "Eliminado de favoritos"}


@router.get("/users/perfil", response_model=PerfilResponse)
def obtener_perfil_completo(current_user=Depends(get_current_user)):
    conn = get_db_connection()
    try:
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
    finally:
        release_connection(conn)

    return {
        "usuario": {
            "id": current_user["id"],
            "email": current_user["email"],
            "full_name": current_user["full_name"],
        },
        "historial": historial,
        "favoritos": favoritos,
    }
