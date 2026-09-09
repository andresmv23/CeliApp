import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv
from .schemas import ProductoAnalizado

load_dotenv()

# ── Connection Pool ────────────────────────────────────────────────────────────
# Se crea una sola vez al arrancar la app. Min 2 conexiones, max 10.
_pool: pool.ThreadedConnectionPool | None = None


def _get_pool() -> pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            _pool = pool.ThreadedConnectionPool(2, 10, dsn=database_url)
        else:
            _pool = pool.ThreadedConnectionPool(
                2, 10,
                host=os.getenv("DB_HOST", "localhost"),
                database=os.getenv("DB_NAME", "celiapp"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASS", ""),
                port=os.getenv("DB_PORT", "5432"),
            )
    return _pool


def get_db_connection():
    """Obtiene una conexión del pool. Devuelve None si falla."""
    try:
        return _get_pool().getconn()
    except Exception as e:
        print(f"🔥 Error obteniendo conexión del pool: {e}")
        return None


def release_connection(conn) -> None:
    """Devuelve la conexión al pool. Llamar siempre en el bloque finally."""
    try:
        if conn:
            _get_pool().putconn(conn)
    except Exception as e:
        print(f"⚠️  Error devolviendo conexión al pool: {e}")


def guardar_producto(producto_analizado: ProductoAnalizado) -> bool:
    """Guarda el resultado completo del flujo de producto."""
    conn = get_db_connection()

    if not conn:
        print("❌ No hay conexión a DB, imposible guardar producto.")
        return False

    try:
        cur = conn.cursor()

        producto = producto_analizado.producto
        analisis = producto_analizado.analisis

        estados_validos = {
            "APTO",
            "NO_APTO",
            "TRAZAS",
            "DUDOSO",
            "SIN_GLUTEN_NO_CERTIFICADO",
        }

        estado_db = analisis.estado
        if estado_db not in estados_validos:
            print(
                f"⚠️ [DB] Estado no válido '{estado_db}'. "
                "Se guardará como DUDOSO."
            )
            estado_db = "DUDOSO"

        fuentes_validas = {
            "OPEN_FOOD_FACTS",
            "ANALISIS_INGREDIENTES",
            "WEB_FABRICANTE",
            "WEB_TERCEROS",
            "SIN_FUENTE_CONFIRMADA",
            "BD_LOCAL",
        }

        fuente_db = analisis.fuente
        if fuente_db not in fuentes_validas:
            fuente_db = "SIN_FUENTE_CONFIRMADA"

        sql = """
            INSERT INTO productos (
                ean,
                nombre,
                marca,
                ingredientes,
                estado_gluten,
                tipo_fuente,
                justificacion,
                url_fuente,
                imagen_url
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (ean) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                marca = EXCLUDED.marca,
                ingredientes = EXCLUDED.ingredientes,
                estado_gluten = EXCLUDED.estado_gluten,
                tipo_fuente = EXCLUDED.tipo_fuente,
                justificacion = EXCLUDED.justificacion,
                url_fuente = EXCLUDED.url_fuente,
                imagen_url = EXCLUDED.imagen_url,
                fecha_registro = CURRENT_TIMESTAMP;
        """

        cur.execute(
            sql,
            (
                producto.ean,
                (producto.nombre or "Desconocido")[:255],
                (producto.marca or "Desconocida")[:100],
                producto.ingredientes or "",
                estado_db,
                fuente_db,
                (analisis.motivo or "Sin justificación disponible.")[:1000],
                analisis.url_info,
                producto.imagen_url,
            ),
        )

        conn.commit()

        print(
            f"💾 [DB] Producto {producto.ean} guardado "
            f"(estado aplicación: {analisis.estado}; estado BD: {estado_db})."
        )
        return True

    except Exception as error:
        conn.rollback()
        print(f"❌ Error guardando producto: {error}")
        return False

    finally:
        if "cur" in locals():
            cur.close()

        release_connection(conn)
