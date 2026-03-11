# 🌾 CeliApp - Asistente Inteligente para Celíacos

> 🚧 **Estado del Proyecto: En Desarrollo Activo (WIP)** 🚧
> *El código base y la arquitectura están implementados. Actualmente trabajando en la refactorización de interfaces y preparando el despliegue del backend en la nube.*

CeliApp es una solución Full-Stack diseñada para ayudar a las personas con celiaquía a identificar si un producto es seguro para su consumo de forma instantánea. Utiliza escaneo de códigos de barras, extracción de datos de etiquetado y evaluación de trazas de gluten mediante Inteligencia Artificial.

## 🚀 Tecnologías Core 

El ecosistema está construido con un enfoque *API-First* para servir a múltiples clientes simultáneamente:

- **Backend (API REST):** Python, FastAPI, Autenticación JWT.
- **Frontend Web:** React, Tailwind CSS, Axios, Context API.
- **App Móvil:** Flutter, Riverpod (Gestión de estado), GoRouter.
- **Inteligencia Artificial:** Integración con Perplexity API para análisis de ingredientes y detección de trazas de gluten ocultas.
- **Lectura de EAN:** `mobile_scanner` (Flutter) y `html5-qrcode` (React Web).

## 🧠 Arquitectura y Flujo de Datos

1. **Escaneo / Input:** El usuario escanea un código EAN-13 desde la app móvil o la web.
2. **Procesamiento Backend:** FastAPI recibe el código, busca los metadatos del producto y extrae la lista de ingredientes.
3. **Análisis IA:** Si el producto no cuenta con certificación oficial "Sin Gluten", el backend delega el análisis de los ingredientes al modelo LLM (Perplexity) para detectar posibles riesgos o nomenclaturas engañosas.
4. **Respuesta Tipificada:** El cliente recibe un estado estandarizado (`APTO`, `NO_APTO`, `DUDOSO`) y lo renderiza visualmente.

## 🗺️ Roadmap de Desarrollo

**Fase 1: Core Ecosistema (✅ Completado)**
- [x] Desarrollo de API RESTful con FastAPI y Pydantic.
- [x] Autenticación segura mediante JSON Web Tokens (JWT).
- [x] Cliente Web en React con protección de rutas.
- [x] Cliente Móvil en Flutter con diseño adaptativo.
- [x] Gestión de perfil de usuario (Historial de escaneos y Favoritos).

**Fase 2: Infraestructura y Cloud (🚀 Siguiente paso)**
- [ ] Conexión a Base de Datos en la nube (MongoDB/PostgreSQL).
- [ ] Despliegue del Backend FastAPI en Render.
- [ ] Hosting del Frontend React en Vercel.
- [ ] Configuración segura de variables de entorno en producción.

## 🛠️ Estructura del Repositorio

- `/backend`: Servidor principal. Contiene rutas (`/auth`, `/producto`, `/users`), modelos de validación y conexión con IA.
- `/frontend`: SPA en React. Incluye el escáner web y paneles de administración de perfil.
- `/mobile`: Código fuente de Flutter. Diseñado con arquitectura limpia y proveedores Riverpod.
