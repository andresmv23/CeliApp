# CeliApp — Contexto del proyecto

## Descripción
Aplicación web para personas celíacas. El usuario introduce o escanea el código de barras (EAN)
de un producto y recibe en segundos si es **APTO**, **NO_APTO** o **DUDOSO**, con explicación
basada en ingredientes reales. También permite análisis por foto del producto.

## Stack
- **Backend:** Python 3.11 + FastAPI + psycopg2 (connection pool) + JWT (python-jose) + Starlette sessions
- **Frontend:** React 18 + Vite + Tailwind CSS v3 + react-router-dom v6
- **Mobile:** Flutter (Dart) — en `celi_app_mobile/` — **en pausa hasta que la web esté terminada**
- **Base de datos:** PostgreSQL (Render en producción)
- **IA:** Perplexity API — `sonar` para búsqueda por EAN, `sonar-pro` para análisis por imagen
- **Auth:** JWT propio + OAuth2 con Google (`google_auth.py`)
- **Deploy:** Railway (backend) + Vercel (frontend) — URL producción: `https://celi-app-lemon.vercel.app`

## Estructura real del proyecto
```
CeliApp/
├── backend/
│   └── app/
│       ├── main.py              # FastAPI app — registra todos los routers
│       ├── database.py          # Connection pool + guardar_producto + guardar_en_historial
│       ├── ia_client.py         # Perplexity API (sonar + sonar-pro visión) — NO tocar prompts
│       ├── analizador.py        # Análisis rápido de ingredientes por regex — NO tocar
│       ├── servicios.py         # Cliente OpenFoodFacts
│       ├── auth.py              # JWT helpers (crear/verificar token, get_current_user)
│       ├── schemas.py           # Modelos Pydantic (request/response)
│       ├── init_db.py           # Inicialización de tablas en arranque
│       └── routers/
│           ├── auth.py          # /register, /login, /me
│           ├── google_auth.py   # /auth/google, /auth/google/callback (OAuth2)
│           ├── productos.py     # /producto/{ean}, /analizar-imagen, /historial
│           ├── favoritos.py     # /favoritos (GET/POST/DELETE)
│           ├── reviews.py       # /reviews (GET/POST) — valoraciones de productos
│           └── admin.py         # /admin/* — endpoints de administración
├── frontend/
│   └── src/
│       ├── main.jsx             # Entry point React
│       ├── App.jsx              # BrowserRouter + AuthProvider + Navbar + rutas
│       ├── index.css            # Estilos globales
│       ├── context/
│       │   └── AuthContext.jsx  # Contexto global de autenticación (token JWT en memoria)
│       └── components/
│           ├── Buscador.jsx         # Página principal: búsqueda por EAN + tabs + resultado
│           ├── Scanner.jsx          # Escáner de código de barras por cámara
│           ├── FotoAnalisis.jsx     # Análisis por foto del producto (sonar-pro visión)
│           ├── Login.jsx            # Login + registro + botón Google OAuth
│           ├── Perfil.jsx           # Historial + favoritos del usuario
│           └── SectionReviews.jsx   # Sección de reviews/valoraciones de productos
└── celi_app_mobile/             # App Flutter (Android/iOS) — en pausa
    └── lib/                     # Código Dart
```

## Rutas del frontend (react-router-dom)
| Ruta | Componente | Protegida |
|---|---|---|
| `/` | `Buscador` | No |
| `/login` | `Login` | No |
| `/oauth-callback` | `OAuthCallback` (inline en App.jsx) | No |
| `/perfil` | `Perfil` | ✅ Sí |
| `*` | Redirect a `/` | — |

## Arquitectura de búsqueda — NO cambiar el orden
1. **BD local** (cache hit → respuesta instantánea)
2. **OpenFoodFacts API** (ingredientes reales del producto)
3. **Perplexity sonar** (deep search por EAN cuando OFF no tiene datos)
4. **sonar-pro + imagen** (análisis visual cuando el usuario sube foto)

## Variables de entorno
### Backend
- `DATABASE_URL` — URL de PostgreSQL (Railway la inyecta automáticamente)
- `PERPLEXITY_API_KEY` — API key de Perplexity
- `SECRET_KEY` — Clave secreta para JWT
- `SESSION_SECRET` — Clave para Starlette SessionMiddleware (obligatoria en arranque)
- `ALLOWED_ORIGINS` — Orígenes CORS extra, separados por coma
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Credenciales OAuth2 Google

### Frontend
- `VITE_API_URL` — URL del backend (ver `.env.example`)

## Reglas de código
- **Backend:** PEP8, type hints en todas las funciones, docstrings en funciones públicas
- **Frontend:** Componentes funcionales con hooks, sin clases React
- **Idioma:** Nombres en español para lógica de dominio (celíaco, ingredientes, ean, apto).
  Inglés para utilidades genéricas
- **Pool de conexiones:** Siempre usar `get_db_connection()` y `release_connection()` en `finally`
- **Historial:** Usar siempre `guardar_en_historial(user_id, ean)` — ya tiene rollback propio
- **Auth en frontend:** El token JWT se guarda **en memoria** (`AuthContext`), nunca en localStorage

## Lo que NO tocar sin consultar
- El orden de la cascada de búsqueda en `routers/productos.py`
- Los prompts de `ia_client.py` (muy afinados para celiaquía)
- El sistema de rate limiting (slowapi) en `main.py`
- La lógica de `analizador.py` (regex de ingredientes con gluten)
- La URL de producción del frontend en CORS (`https://celi-app-lemon.vercel.app`)

## Tareas pendientes prioritarias
1. Tests unitarios de `analizador.py` con pytest
2. Refactorizar `Buscador.jsx` extrayendo subcomponentes: `ResultadoProducto`, `TabsEscaneo`, `EstadoVacio`
3. Integrar `SectionReviews.jsx` dentro de `Buscador.jsx` para mostrar reviews tras el resultado
4. Migrar estilos inline de `App.jsx` a clases Tailwind consistentes
5. Documentar endpoints en README (o Swagger auto-generado por FastAPI en `/docs`)
6. Retomar `celi_app_mobile/` cuando la web esté al 100%

## Comandos útiles
```bash
# Levantar backend
cd backend && uvicorn app.main:app --reload

# Levantar frontend
cd frontend && npm run dev

# Levantar todo con Docker
docker-compose up

# Inicializar BD local
cd backend && python -m app.init_db

# Tests (cuando existan)
cd backend && pytest
```
