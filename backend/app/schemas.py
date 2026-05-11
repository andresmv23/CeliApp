from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


# ── Schemas existentes (sin cambios) ─────────────────────────────────────────

class AnalisisRequest(BaseModel):
    ingredientes: str


class AnalisisResponse(BaseModel):
    necesita_ia: bool
    es_apto: bool = None
    motivo: str
    confianza: str
    ingredientes_dudosos: List[str] = []


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserInfo(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None


class ProductoBasico(BaseModel):
    nombre: str
    marca: str
    ean: str
    estado_gluten: str


class ProductoHistorial(ProductoBasico):
    fecha: datetime


class PerfilResponse(BaseModel):
    usuario: UserInfo
    historial: List[ProductoHistorial]
    favoritos: List[ProductoBasico]


# Schemas para /analizar-imagen

class ImagenAnalisisRequest(BaseModel):
    ean: Optional[str] = ""
    imagen_base64: str


class ProductoImagen(BaseModel):
    nombre: Optional[str] = None
    marca: Optional[str] = None
    ingredientes: Optional[str] = None
    imagen_url: Optional[str] = None


class AnalisisImagen(BaseModel):
    es_apto: Optional[bool] = None
    estado: str
    motivo: str
    confianza: str
    analizado_por: str = "vision"


class ImagenAnalisisResponse(BaseModel):
    fuente: str
    producto: ProductoImagen
    analisis: AnalisisImagen