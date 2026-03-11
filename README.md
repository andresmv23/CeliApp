# 🌾 CeliApp - Asistente Inteligente para Celíacos

> 🚧 **Estado del Proyecto: En Desarrollo Activo (WIP)** 🚧
> *Actualmente estoy construyendo y optimizando la arquitectura base y las interfaces de usuario. Las integraciones de despliegue continuo (CI/CD) y la versión de producción estarán disponibles próximamente.*

CeliApp es una solución Full-Stack diseñada para ayudar a las personas con celiaquía a identificar si un producto es apto para su consumo. Utiliza reconocimiento de códigos de barras, extracción de datos y análisis de ingredientes mediante Inteligencia Artificial.

## 🚀 Tecnologías Core (Stack MERN / Python)

- **Frontend Web:** React, Tailwind CSS, Context API.
- **App Móvil:** Flutter, Riverpod, GoRouter.
- **Backend:** Python, FastAPI, JWT Authentication.
- **Base de Datos:** [MongoDB / PostgreSQL - Añade la tuya].
- **IA y Herramientas:** [Librería de escaneo de barras / IA utilizada].

## 🧠 Arquitectura Actual y Roadmap

El proyecto está diseñado bajo una arquitectura de microservicios (Backend separado de los clientes) para permitir escalabilidad. 

**Implementado actualmente (Fase 1):**
- [x] Desarrollo de API RESTful con FastAPI.
- [x] Autenticación segura mediante JSON Web Tokens (JWT).
- [x] UI/UX base para Web (React) y Móvil (Flutter).
- [x] Lógica de lectura de códigos de barras en dispositivos.

**En desarrollo (Próximos pasos):**
- [ ] Refactorización y pulido de interfaces (Pixel-perfect).
- [ ] Despliegue de Base de Datos en producción.
- [ ] Despliegue del Backend en Render/Railway.
- [ ] Hosting del Frontend Web en Vercel.
- [ ] Pruebas unitarias de los endpoints críticos.

## 🛠️ Estructura del Repositorio

- `/backend`: Contiene el servidor FastAPI, modelos Pydantic y lógica de rutas.
- `/frontend`: Aplicación web desarrollada en React.
- `/mobile`: Aplicación móvil desarrollada en Flutter.
