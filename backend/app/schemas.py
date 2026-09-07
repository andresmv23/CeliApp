from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal
from datetime import datetime

EstadoGluten = Literal[
    "APTO",
    "NO_APTO",
    "TRAZAS",
    "DUDOSO",
    "SIN_GLUTEN_NO_CERTIFICADO",
]

EstadoGlutenOFF = Literal[
    "SIN_GLUTEN",
    "CON_GLUTEN",
    "TRAZAS",
    "NO_INFO",
]

ConfianzaAnalisis = Literal["alta", "media", "baja"]

FuenteAnalisis = Literal[
    "BD_LOCAL",
    "OPEN_FOOD_FACTS",
    "ANALISIS_INGREDIENTES",
    "WEB_FABRICANTE",
    "WEB_TERCEROS",
    "SIN_FUENTE_CONFIRMADA",
]

class Producto(BaseModel):
    ean: str
    ingredientes: Optional[str] = None
    imagen_url: Optional[str] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None
    trazas_declaradas: Optional[str] = None

class ProductoOFF(BaseModel):
    encontrado: bool
    ean: Optional[str] = None
    nombre: Optional[str] = None
    marca: Optional[str] = None
    ingredientes: Optional[str] = None
    trazas_declaradas: Optional[str] = None
    imagen_url: Optional[str] = None
    gluten_segun_off: Optional[EstadoGlutenOFF] = None
    url_fuente: Optional[str] = None

class Analisis(BaseModel):
    es_apto: bool
    motivo: str
    url_info: Optional[str] = None
    fuente: FuenteAnalisis
    estado: EstadoGluten
    confianza: ConfianzaAnalisis


class ProductoAnalizado(BaseModel):
    producto: Producto
    analisis: Analisis

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