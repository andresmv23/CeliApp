import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    try:
        # Railway inyecta DATABASE_URL automáticamente
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            conn = psycopg2.connect(database_url)
        else:
            # Fallback para desarrollo local
            conn = psycopg2.connect(
                host=os.getenv("DB_HOST", "localhost"),
                database=os.getenv("DB_NAME", "celiapp"),
                user=os.getenv("DB_USER", "postgres"),
                password=os.getenv("DB_PASS", "xenia"),
                port=os.getenv("DB_PORT", "5432"),
            )
        return conn
    except Exception as e:
        print(f"🔥 Error fatal conectando a DB: {e}")
        return None


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
        conn.close()
        print(f"💾 [DB] Producto {ean} guardado correctamente (Estado: {estado_final}).")

    except Exception as e:
        print(f"❌ Error CRÍTICO guardando en DB: {e}")
        if conn:
            conn.rollback()
