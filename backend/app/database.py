import os
import psycopg2
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

# ── Connection Pool ────────────────────────────────────────────────────────────
# Se crea una sola vez al arrancar la app. Min 2 conexiones, max 10.
_pool: pool.SimpleConnectionPool | None = None


def _get_pool() -> pool.SimpleConnectionPool:
    global _pool
    if _pool is None:
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            _pool = pool.SimpleConnectionPool(2, 10, dsn=database_url)
        else:
            _pool = pool.SimpleConnectionPool(
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


def guardar_producto(ean, datos_producto, analisis_result, fuente_datos):
    conn = get_db_connection()
    if not conn:
        print("❌ No hay conexión a DB, imposible guardar.")
        return

    try:
        cur = conn.cursor()

        nombre = (
            datos_producto.get("nombre")
            or datos_producto.get("product_name")
            or "Desconocido"
        )
        marca = (
            datos_producto.get("marca") or datos_producto.get("brands") or "Desconocida"
        )
        ingredientes = (
            datos_producto.get("ingredientes")
            or datos_producto.get("ingredients_text")
            or ""
        )

        estado_raw = analisis_result.get("estado", "DUDOSO")
        if analisis_result.get("es_apto") is True and estado_raw == "DUDOSO":
            estado_raw = "APTO"

        estados_validos = ["APTO", "NO_APTO", "TRAZAS", "DUDOSO"]
        estado_final = estado_raw if estado_raw in estados_validos else "DUDOSO"

        url = (
            datos_producto.get("url")
            or datos_producto.get("url_fuente")
            or f"https://world.openfoodfacts.org/product/{ean}"
        )

        imagen_url = datos_producto.get("imagen_url", "")

        sql = """
            INSERT INTO productos (ean, nombre, marca, ingredientes, estado_gluten, tipo_fuente, justificacion, url_fuente, imagen_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (ean) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                marca = EXCLUDED.marca,
                ingredientes = EXCLUDED.ingredientes,
                estado_gluten = EXCLUDED.estado_gluten,
                tipo_fuente = EXCLUDED.tipo_fuente,
                justificacion = EXCLUDED.justificacion,
                imagen_url = EXCLUDED.imagen_url,
                fecha_registro = CURRENT_TIMESTAMP;
        """

        cur.execute(
            sql,
            (
                ean,
                nombre[:255],
                marca[:100],
                ingredientes,
                estado_final,
                fuente_datos,
                analisis_result.get("motivo", "")[:1000],
                url,
                imagen_url,
            ),
        )

        conn.commit()
        cur.close()
        print(f"💾 [DB] Producto {ean} guardado correctamente (Estado: {estado_final}).")

    except Exception as e:
        print(f"❌ Error CRÍTICO guardando en DB: {e}")
        conn.rollback()
    finally:
        release_connection(conn)
