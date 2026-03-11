import os
import psycopg2
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv() 

def crear_tablas_usuarios():
    print("⏳ Conectando a la base de datos para crear sistema de usuarios...")
    
    if not os.getenv("DB_PASS"):
        print("❌ ERROR: No se ha encontrado DB_PASS en las variables de entorno.")
        return

    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            database=os.getenv("DB_NAME", "celiapp"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS"),
            port=os.getenv("DB_PORT", "5432")
        )
        cur = conn.cursor()
        
        # SQL para crear las tablas (OJO: No borramos 'productos')
        sql_crear_tablas = """
        -- 1. Tabla de Usuarios
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. Tabla de Favoritos (Relación Usuario <-> Producto)
        -- Depende de que la tabla 'productos' exista. Si no existe, esto fallará.
        CREATE TABLE IF NOT EXISTS favorites (
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            product_ean VARCHAR(20) REFERENCES productos(ean) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, product_ean) 
        );

        -- 3. Tabla de Historial (Log de escaneos)
        CREATE TABLE IF NOT EXISTS scan_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            product_ean VARCHAR(20) REFERENCES productos(ean) ON DELETE CASCADE,
            scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cur.execute(sql_crear_tablas)
        conn.commit()
        
        print(f"✅ ÉXITO: Tablas 'users', 'favorites' y 'scan_history' creadas correctamente.")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print("\n❌ ERROR SQL:")
        print(f"Mensaje: {e}")

if __name__ == "__main__":
    crear_tablas_usuarios()
