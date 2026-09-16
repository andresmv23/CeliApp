# CeliApp

CeliApp es una aplicación full-stack creada para ayudar a las personas celíacas a consultar productos y revisar si la información disponible indica que son aptos, no aptos o no concluyentes para una dieta sin gluten.

> Proyecto en fase beta. CeliApp es una herramienta de apoyo y no sustituye la lectura del etiquetado oficial, la consulta con el fabricante ni el criterio de un profesional sanitario.

## Funcionalidades

- Consulta de productos mediante código EAN.
- Integración con Open Food Facts para localizar productos e información declarada.
- Análisis de ingredientes y clasificación en `APTO`, `NO APTO` o `DUDOSO`.
- Distinción entre gluten confirmado, ausencia de gluten declarada e información insuficiente.
- Análisis alternativo mediante una fotografía nítida donde se vean el nombre y la marca del producto.
- Búsqueda de información adicional sobre ingredientes mediante IA.
- Escaneo del código de barras desde la cámara del dispositivo.
- Autenticación mediante Google.
- Gestión de productos favoritos e historial de consultas.
- Panel de administración y moderación.

## Arquitectura

El proyecto está dividido en tres partes principales:

```text
CeliApp/
├── backend/           # API y lógica de negocio con FastAPI
├── frontend/          # Aplicación web con React y Vite
├── celi_app_mobile/   # Cliente móvil
├── docker-compose.yml # Configuración de servicios locales
└── README.md
```

El frontend se comunica con la API del backend. El backend consulta fuentes externas, procesa la información del producto y devuelve un análisis estructurado al cliente.

## Tecnologías

### Frontend

- React
- Vite
- Axios
- Tailwind CSS
- Integración con cámara y lector de códigos

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL
- Integraciones con Open Food Facts y servicios de IA

### Infraestructura

- Vercel para el frontend.
- Render para la API.
- Neon para PostgreSQL.
- Docker Compose para el entorno local.

## Flujo de análisis

1. El usuario introduce un código EAN o escanea el código de barras.
2. CeliApp busca el producto en sus fuentes disponibles, empezando por Open Food Facts.
3. El backend analiza la información del producto y sus ingredientes.
4. La aplicación muestra el resultado, la fuente consultada, los ingredientes y la imagen disponible.
5. Si el resultado no es concluyente o el usuario quiere una segunda comprobación, puede hacer una foto nítida del nombre y la marca.
6. La IA utiliza esa información para buscar el producto y revisar sus ingredientes en fuentes públicas.

La ausencia de información no se interpreta automáticamente como presencia de gluten. Cuando los datos no permiten confirmar una conclusión, CeliApp muestra un estado dudoso o no confirmado.

## Inteligencia artificial

CeliApp utiliza Sonar para búsquedas generales y Sonar Pro para los análisis basados en imágenes. El análisis fotográfico está pensado para identificar el producto a partir de una imagen clara de su nombre y marca; no es necesario fotografiar la lista completa de ingredientes.

Las imágenes se utilizan para realizar el análisis y no se presentan como un sistema de almacenamiento permanente de fotografías de usuarios.

## Requisitos

- Node.js 18 o superior.
- Python 3.11 o superior.
- Docker y Docker Compose, opcionalmente.
- Una base de datos PostgreSQL.
- Claves de las integraciones externas utilizadas por el backend.

## Instalación local

### Con Docker Compose

```bash
git clone https://github.com/andresmv23/CeliApp.git
cd CeliApp
docker compose up --build
```

Los puertos y servicios concretos dependen de la configuración incluida en `docker-compose.yml`.

### Ejecución manual

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

En Windows PowerShell, la activación del entorno virtual puede realizarse con:

```powershell
.venv\Scripts\Activate.ps1
```

## Variables de entorno

Configura las variables necesarias en los archivos `.env` correspondientes. Los nombres exactos pueden variar según la versión del proyecto y deben mantenerse fuera del control de versiones.

Entre las configuraciones habituales se encuentran:

- URL de conexión a PostgreSQL.
- URL base de la API.
- Credenciales de autenticación con Google.
- Claves de los servicios de IA.
- Configuración de CORS.
- Secretos utilizados para firmar sesiones o tokens.

No subas claves privadas, tokens ni archivos `.env` al repositorio.

## Despliegue

La configuración actual utiliza:

- Vercel para publicar el frontend.
- Render para ejecutar el backend.
- Neon como proveedor de PostgreSQL.

Antes de desplegar, comprueba que la URL pública de la API, las variables de entorno, CORS y las credenciales de autenticación estén configuradas para el entorno correspondiente.

## Estado del proyecto

CeliApp se encuentra en desarrollo activo y actualmente se presenta como una beta funcional. La aplicación continúa evolucionando en aspectos como validación de fuentes, análisis asistido por IA, experiencia móvil, moderación y observabilidad.

## Responsabilidad

La información mostrada por CeliApp depende de las fuentes consultadas y puede estar incompleta, desactualizada o contener errores. Ante una duda sobre un producto, especialmente en caso de celiaquía o alergias, debe prevalecer siempre el etiquetado oficial del producto, la información del fabricante y el consejo de un profesional sanitario.

## Autor

Proyecto personal de Andrés Mejía Valdez.

- Repositorio: https://github.com/andresmv23/CeliApp
- Frontend: https://celi-app-lemon.vercel.app/
