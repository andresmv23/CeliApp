import os
from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import HTMLResponse
from psycopg2.extras import RealDictCursor
from typing import Optional
from pydantic import BaseModel

from app.database import get_db_connection, release_connection

router = APIRouter()

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "")


def _verificar_admin(x_admin_secret: str = Header(...)):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Acceso denegado")


class ProductoUpdate(BaseModel):
    estado_gluten: Optional[str] = None
    justificacion: Optional[str] = None
    ingredientes: Optional[str] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None


class ReviewAccion(BaseModel):
    estado: str  # 'aprobada' | 'rechazada'


# ── PRODUCTOS ─────────────────────────────────────────────────────────────────

@router.get("/admin/productos")
def listar_productos(
    estado: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    x_admin_secret: str = Header(...),
):
    _verificar_admin(x_admin_secret)

    offset = (pagina - 1) * limite
    filtros = []
    params = []

    if estado:
        filtros.append("estado_gluten = %s")
        params.append(estado)
    if busqueda:
        filtros.append("(LOWER(nombre) LIKE %s OR LOWER(marca) LIKE %s OR ean LIKE %s)")
        like = f"%{busqueda.lower()}%"
        params.extend([like, like, like])

    where = ("WHERE " + " AND ".join(filtros)) if filtros else ""

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT COUNT(*) as total FROM productos {where}", params)
        total = cur.fetchone()["total"]

        cur.execute(
            f"SELECT ean, nombre, marca, estado_gluten, tipo_fuente, justificacion, ingredientes, imagen_url, fecha_registro "
            f"FROM productos {where} ORDER BY fecha_registro DESC LIMIT %s OFFSET %s",
            params + [limite, offset],
        )
        productos = cur.fetchall()
        return {"total": total, "pagina": pagina, "productos": productos}
    finally:
        release_connection(conn)


@router.put("/admin/producto/{ean}")
def editar_producto(ean: str, body: ProductoUpdate, x_admin_secret: str = Header(...)):
    _verificar_admin(x_admin_secret)

    estados_validos = ["APTO", "NO_APTO", "TRAZAS", "DUDOSO"]
    if body.estado_gluten and body.estado_gluten not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado no válido. Usa: {estados_validos}")

    campos = []
    params = []
    if body.estado_gluten is not None:
        campos.append("estado_gluten = %s")
        params.append(body.estado_gluten)
    if body.justificacion is not None:
        campos.append("justificacion = %s")
        params.append(body.justificacion)
    if body.ingredientes is not None:
        campos.append("ingredientes = %s")
        params.append(body.ingredientes)
    if body.nombre is not None:
        campos.append("nombre = %s")
        params.append(body.nombre)
    if body.marca is not None:
        campos.append("marca = %s")
        params.append(body.marca)

    if not campos:
        raise HTTPException(status_code=400, detail="Nada que actualizar")

    params.append(ean)
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"UPDATE productos SET {', '.join(campos)} WHERE ean = %s", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        conn.commit()
        return {"ok": True, "ean": ean}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


@router.delete("/admin/producto/{ean}")
def borrar_producto(ean: str, x_admin_secret: str = Header(...)):
    _verificar_admin(x_admin_secret)

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM productos WHERE ean = %s", (ean,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        conn.commit()
        return {"ok": True, "eliminado": ean}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


# ── REVIEWS ───────────────────────────────────────────────────────────────────

@router.get("/admin/reviews")
def listar_reviews_admin(
    estado: Optional[str] = Query(None, description="pendiente | aprobada | rechazada"),
    pagina: int = Query(1, ge=1),
    limite: int = Query(20, ge=1, le=100),
    x_admin_secret: str = Header(...),
):
    """Lista todas las reviews con filtro opcional por estado."""
    _verificar_admin(x_admin_secret)

    offset = (pagina - 1) * limite
    where = "WHERE estado = %s" if estado else ""
    params = [estado] if estado else []

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f"SELECT COUNT(*) as total FROM reviews {where}", params)
        total = cur.fetchone()["total"]

        cur.execute(
            f"SELECT id, user_id, nombre, ciudad, email, texto, estrellas, estado, created_at "
            f"FROM reviews {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            params + [limite, offset],
        )
        reviews = cur.fetchall()
        return {"total": total, "pagina": pagina, "reviews": reviews}
    finally:
        release_connection(conn)


@router.patch("/admin/reviews/{review_id}")
def moderar_review(
    review_id: int,
    body: ReviewAccion,
    x_admin_secret: str = Header(...),
):
    """Aprueba o rechaza una review."""
    _verificar_admin(x_admin_secret)

    estados_validos = ["aprobada", "rechazada"]
    if body.estado not in estados_validos:
        raise HTTPException(status_code=400, detail=f"Estado no válido. Usa: {estados_validos}")

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE reviews SET estado = %s WHERE id = %s",
            (body.estado, review_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Review no encontrada")
        conn.commit()
        return {"ok": True, "review_id": review_id, "nuevo_estado": body.estado}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


@router.delete("/admin/reviews/{review_id}")
def eliminar_review(review_id: int, x_admin_secret: str = Header(...)):
    """Elimina una review definitivamente."""
    _verificar_admin(x_admin_secret)

    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM reviews WHERE id = %s", (review_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Review no encontrada")
        conn.commit()
        return {"ok": True, "eliminada": review_id}
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


# ── PANEL HTML ────────────────────────────────────────────────────────────────

@router.get("/admin", response_class=HTMLResponse, include_in_schema=False)
def panel_admin():
    with open(os.path.join(os.path.dirname(__file__), "..", "static", "admin.html"), encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
