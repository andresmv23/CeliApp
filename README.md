# 🌾 CeliApp – Asistente inteligente para personas celíacas

CeliApp es una aplicación **full-stack en producción** que ayuda a personas con celiaquía a comprobar en segundos si un producto es seguro para su consumo, escaneando el código de barras o introduciendo el EAN manualmente.

- 🌐 Web en producción: https://celi-app-lemon.vercel.app/
- 🧩 Stack: **React + Tailwind CSS + FastAPI + PostgreSQL**
- ☁️ Infraestructura: **Frontend en Vercel, API y base de datos en Railway**

---

## 🎯 Problema que resuelve

Leer etiquetas cada vez que una persona celíaca va al supermercado es lento, agotador y propenso a errores.  
Muchos productos no tienen el sello “Sin gluten”, pero sí ingredientes o trazas que hay que interpretar con cuidado.

CeliApp permite:

- Escanear un producto (EAN-13) y obtener una evaluación clara:
  - `APTO`
  - `NO_APTO`
  - `DUDOSO`
- Ver un resumen explicativo de por qué el producto es o no seguro.
- Consultar el **historial de búsquedas** y guardar **favoritos** para accesos rápidos.

---

## 🧠 Arquitectura y flujo

1. **Frontend (React + Tailwind)**  
   - SPA con Context API para manejar autenticación y estado global.  
   - Escáner web de código de barras y formulario manual de EAN.  
   - Vistas principales:
     - Buscador de productos
     - Resultado de aptitud
     - Perfil con historial y favoritos

2. **Backend (FastAPI)**  
   - API REST con endpoints para:
     - Autenticación y registro de usuarios (JWT)
     - Consulta de producto por EAN
     - Gestión de historial de escaneos
     - Gestión de favoritos
   - Integración con servicios externos para obtener la ficha del producto.
   - Uso de un modelo LLM (Perplexity API) para analizar ingredientes y detectar posibles trazas de gluten difíciles de interpretar.

3. **Base de datos (PostgreSQL)**  
   - Desplegada en Railway.
   - Tablas principales:
     - `users`
     - `historial_busquedas`
     - `favoritos`
   - Cada escaneo del usuario queda registrado con:
     - EAN
     - nombre del producto
     - resultado (`APTO` / `NO_APTO` / `DUDOSO`)
     - marca temporal

4. **Infraestructura**  
   - Frontend desplegado en **Vercel**.
   - API y base de datos desplegadas en **Railway**.
   - Variables de entorno separadas para desarrollo y producción.

---

## 🧩 Tecnologías destacadas

- **Frontend**
  - React
  - Tailwind CSS
  - Axios
  - Context API / Hooks

- **Backend**
  - FastAPI
  - Pydantic
  - Autenticación JWT
  - Integración con APIs externas
  - Cliente HTTP para llamada a modelo LLM (Perplexity)

- **DevOps / Infra**
  - Vercel (frontend)
  - Railway (API + PostgreSQL)
  - Gestión de variables de entorno
  - Logs y pruebas en entorno real

---

## 👤 Rol y responsabilidades

Proyecto desarrollado de principio a fin:

- Diseño de la arquitectura **full‑stack** (frontend, backend y base de datos).
- Implementación de la API REST y modelo de datos relacional en PostgreSQL.
- Desarrollo de la interfaz web orientada a **claridad y confianza** para usuarios celíacos.
- Integración con modelo LLM para análisis semántico de ingredientes.
- Despliegue y configuración de la infraestructura en producción.

---

## 🔜 Próximos pasos

- Pulir la experiencia móvil (PWA / app nativa).
- Ampliar fuentes de datos de productos.
- Sistema de feedback de usuarios sobre la precisión de los resultados.
- Panel interno para analizar estadísticas de uso.
