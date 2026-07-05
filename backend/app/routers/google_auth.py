import os
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from psycopg2.extras import RealDictCursor

from app.database import get_db_connection, release_connection
from app.auth import create_access_token

router = APIRouter()

# ── OAuth setup ───────────────────────────────────────────────────────────────
config = Config(environ={
    "GOOGLE_CLIENT_ID":     os.getenv("GOOGLE_CLIENT_ID", ""),
    "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET", ""),
})

oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/auth/google/login")
async def google_login(request: Request):
    """
    Redirige al usuario a la pantalla de login de Google.
    """
    redirect_uri = str(request.url_for("google_callback"))
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback", name="google_callback")
async def google_callback(request: Request):
    """
    Google redirige aquí tras el login.
    Crea o recupera el usuario en BD y emite nuestro JWT.
    Redirige al frontend con el token como query param.
    """
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error OAuth Google: {e}")

    user_info = token.get("userinfo")
    if not user_info:
        raise HTTPException(status_code=400, detail="No se pudo obtener la información del usuario de Google")

    email     = user_info.get("email")
    full_name = user_info.get("name", "")

    if not email:
        raise HTTPException(status_code=400, detail="Google no devolvió email")

    # ── Buscar o crear usuario ────────────────────────────────────────────────
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)

        cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
        db_user = cur.fetchone()

        if not db_user:
            cur.execute(
                """
                INSERT INTO users (email, full_name, hashed_password, provider)
                VALUES (%s, %s, NULL, 'google')
                RETURNING id, email, full_name
                """,
                (email, full_name),
            )
            db_user = cur.fetchone()
            conn.commit()
        elif not _has_provider_column(cur):
            # Si el usuario ya existía (registro clásico), no hacemos nada raro
            pass

    finally:
        release_connection(conn)

    # ── Emitir nuestro JWT ────────────────────────────────────────────────────
    access_token = create_access_token(data={"sub": email})

    # ── Redirigir al frontend con el token ───────────────────────────────────
    redirect_url = f"{FRONTEND_URL}/oauth-callback?token={access_token}&name={full_name}"
    return RedirectResponse(url=redirect_url)


def _has_provider_column(cur) -> bool:
    """Comprueba si la columna 'provider' existe en users."""
    cur.execute("""
        SELECT column_name FROM information_schema.columns
        WHERE table_name='users' AND column_name='provider'
    """)
    return cur.fetchone() is not None
