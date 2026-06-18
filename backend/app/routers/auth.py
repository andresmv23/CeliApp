from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from psycopg2.extras import RealDictCursor
from typing import Optional
import psycopg2

from app.database import get_db_connection, release_connection
from app.schemas import UserCreate, UserResponse, Token
from app.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    jwt,
    SECRET_KEY,
    ALGORITHM,
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


# ── Auth helpers ──────────────────────────────────────────────────────────────

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Devuelve el usuario autenticado o lanza 401."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido: falta sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
    finally:
        release_connection(conn)

    if user is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


def get_optional_user(token: Optional[str] = Depends(oauth2_scheme_optional)):
    """Devuelve el usuario si hay token válido, o None si no hay sesión."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
        conn = get_db_connection()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT id, email, full_name FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
        finally:
            release_connection(conn)
        return user
    except Exception:
        return None


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/auth/register", response_model=UserResponse)
def registrar_usuario(user: UserCreate):
    conn = get_db_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Error conectando a BD")
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        hashed_pwd = get_password_hash(user.password)
        cursor.execute(
            "INSERT INTO users (email, hashed_password, full_name) VALUES (%s, %s, %s) RETURNING id, email, full_name",
            (user.email, hashed_pwd, user.full_name),
        )
        new_user = cursor.fetchone()
        conn.commit()
        return new_user
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_connection(conn)


@router.post("/auth/login", response_model=Token)
def login_usuario(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = get_db_connection()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute("SELECT * FROM users WHERE email = %s", (form_data.username,))
        user_db = cursor.fetchone()
    finally:
        release_connection(conn)

    if not user_db or not verify_password(form_data.password, user_db["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user_db["email"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=UserResponse)
def leer_usuario_actual(current_user=Depends(get_current_user)):
    return current_user
