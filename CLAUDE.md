# CeliApp — Contexto para Claude Code

## Descripción
Aplicación de detección de gluten para personas celíacas. El usuario introduce o escanea
el código de barras (EAN) de un producto y recibe en segundos si es APTO, NO_APTO o DUDOSO,
con explicación basada en ingredientes reales.

## Stack
- **Backend:** Python 3.11 + FastAPI + psycopg2 (connection pool) + JWT (python-jose)
- **Frontend:** React 18 + Vite + Tailwind CSS v3
- **Mobile:** Flutter (Dart) — en `celi_app_mobile/`
- **Base de datos:** PostgreSQL (Railway en producción)
- **IA:** Perplexity API — `sonar` para búsqueda por EAN, `sonar-pro` para análisis por imagen
- **Deploy:** Railway (backend) + Vercel (frontend)

## Estructura del proyecto
```
CeliApp/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app + todos los endpoints
│       ├── database.py      # Connection pool + guardar_producto
│       ├── ia_client.py     # Perplexity API (sonar + sonar-pro visión)
│       ├── analizador.py    # Análisis rápido de ingredientes por regex
│       ├── servicios.py     # Cliente OpenFoodFacts
│       ├── auth.py          # JWT helpers
│       ├── schemas.py       # Modelos Pydantic
│       └── init_db.py       # Script de inicialización de tablas
├── frontend/
│   └── src/
│       ├── App.jsx                    # Router manual + Navbar + layout
│       └── components/
│           ├── Buscador.jsx           # Página principal (hero + búsqueda + resultados)
│           ├── Scanner.jsx            # Escáner de código de barras por cámara
│           ├── FotoAnalisis.jsx       # Análisis por foto del producto
│           ├── Login.jsx              # Login + registro
│           └── Perfil.jsx             # Historial + favoritos del usuario
└── celi_app_mobile/                   # App Flutter
```

## Arquitectura de búsqueda — NO cambiar el orden
1. **BD local** (cache hit → respuesta instantánea)
2. **OpenFoodFacts API** (ingredientes reales del producto)
3. **Perplexity sonar** (deep search por EAN cuando OFF no tiene datos)
4. **sonar-pro + imagen** (análisis visual cuando el usuario sube foto)

## Variables de entorno necesarias
### Backend
- `DATABASE_URL` — URL de PostgreSQL (Railway la inyecta automáticamente)
- `PERPLEXITY_API_KEY` — API key de Perplexity
- `SECRET_KEY` — Clave secreta para JWT
- `ALLOWED_ORIGINS` — Orígenes permitidos en CORS, separados por coma

### Frontend
- `VITE_API_URL` — URL del backend (ver `.env.example`)

## Reglas de código
- **Backend:** PEP8, type hints en todas las funciones, docstrings en funciones públicas
- **Frontend:** Componentes funcionales con hooks, sin clases React
- **Idioma:** Nombres en español para lógica de dominio (celíaco, ingredientes, ean, apto)
  Inglés para utilidades genéricas
- **Pool de conexiones:** Siempre usar `get_db_connection()` y `release_connection()` en `finally`
- **Historial:** Usar siempre `guardar_en_historial(user_id, ean)` — ya tiene rollback propio

## Lo que NO tocar sin consultar
- El orden de la cascada de búsqueda en `/producto/{ean}`
- Los prompts de `ia_client.py` (muy afinados para celiaquía)
- El sistema de rate limiting (slowapi)
- La lógica de `analizador.py` (regex de ingredientes con gluten)

## Tareas pendientes prioritarias
1. Separar `main.py` en routers: `routers/auth.py`, `routers/productos.py`, `routers/favoritos.py`
2. Tests unitarios de `analizador.py` con pytest
3. Migrar routing del frontend de `useState` a `react-router-dom`
4. Refactorizar `Buscador.jsx` extrayendo componentes: `ResultadoProducto`, `TabsEscaneo`, `EstadoVacio`
5. Añadir `docker-compose.yml` para desarrollo local
6. Actualizar README con endpoints documentados

## Comandos útiles
```bash
# Levantar backend
cd backend && uvicorn app.main:app --reload

# Levantar frontend
cd frontend && npm run dev

# Inicializar BD local
cd backend && python -m app.init_db
```
