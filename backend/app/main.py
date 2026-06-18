import os
import sys
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.routers import auth, productos, favoritos

app = FastAPI(title="CeliApp API")

# ── Rate limiting ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Dominios de producción siempre permitidos
PRODUCTION_ORIGINS = [
    "https://celi-app-lemon.vercel.app",
]

ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "")
# strip() elimina espacios y saltos de línea invisibles en cada origen
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
app.include_router(productos.router)
app.include_router(favoritos.router)


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"mensaje": "¡CeliApp Backend con Auth, IA y DB Persistente!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
