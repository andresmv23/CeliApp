import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, productos, favoritos, admin, reviews
from app.routers import google_auth
from app.init_db import inicializar_base_datos

app = FastAPI(title="CeliApp API")

inicializar_base_datos()

# ── Session middleware ───────────────────────────────────────────────────────────────
SESSION_SECRET = os.getenv("SESSION_SECRET")
if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET no está configurado en las variables de entorno")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

# ── Rate limiting ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
PRODUCTION_ORIGINS = [
    "https://celi-app-lemon.vercel.app",
]

ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
extra_origins = [
    o.strip().rstrip("/")
    for o in ALLOWED_ORIGINS_RAW.split(",")
    if o.strip()
]

ALLOWED_ORIGINS = list(set(PRODUCTION_ORIGINS + extra_origins + [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]))

if "pytest" not in sys.modules:
    print(f"✅ CORS allow_origins: {ALLOWED_ORIGINS}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(google_auth.router)
app.include_router(productos.router)
app.include_router(favoritos.router)
app.include_router(admin.router)
app.include_router(reviews.router)


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"mensaje": "¡CeliApp Backend con Auth, IA y DB Persistente!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
