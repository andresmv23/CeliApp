import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de conexión (Toma las variables de tu .env)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "celiapp") # OJO: Asegúrate de que este nombre sea correcto en tu .env
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "xenia")
DB_PORT = os.getenv("DB_PORT", "5432")

def inicializar_base_datos():
    """
    Crea las tablas necesarias para CeliApp si no existen.
    """
    print(f"🔌 Conectando a {DB_NAME} en {DB_HOST}...")
    
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cur = conn.cursor()
        
        # --- 1. TABLA USUARIOS (Ya la tenías, pero por si acaso) ---
        print("🔨 Verificando tabla 'users'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                full_name VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # --- 2. TABLA PRODUCTOS (Ya la tenías, pero por si acaso) ---
        print("🔨 Verificando tabla 'productos'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS productos (
                ean VARCHAR(20) PRIMARY KEY,
                nombre VARCHAR(255),
                marca VARCHAR(100),
                ingredientes TEXT,
                estado_gluten VARCHAR(20) CHECK (estado_gluten IN ('APTO', 'NO_APTO', 'TRAZAS', 'DUDOSO')),
                tipo_fuente VARCHAR(50),
                justificacion TEXT,
                url_fuente TEXT,
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # --- 3. TABLA HISTORIAL (NUEVA) ---
        print("🔨 Creando tabla 'historial_busquedas'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS historial_busquedas (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                ean VARCHAR(20) REFERENCES productos(ean) ON DELETE CASCADE,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # --- 4. TABLA FAVORITOS (NUEVA) ---
        print("🔨 Creando tabla 'favoritos'...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS favoritos (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                ean VARCHAR(20) REFERENCES productos(ean) ON DELETE CASCADE,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT unique_favorito UNIQUE(user_id, ean)
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("✅ ¡Base de datos inicializada correctamente! Todo listo. 🚀")
        
    except Exception as e:
        print(f"❌ Error fatal inicializando DB: {e}")
        print("Consejo: Verifica que el contenedor Docker esté encendido y que las credenciales en .env sean correctas.")

if __name__ == "__main__":
    inicializar_base_datos()