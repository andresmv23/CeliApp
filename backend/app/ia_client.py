import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"


# ─────────────────────────────────────────────────────────────────────────────
# Función original — búsqueda por EAN con sonar (sin cambios)
# ─────────────────────────────────────────────────────────────────────────────
def consultar_ia_experto_total(ean: str, nombre_producto: str = ""):
    print(f"\n🤖 IA Deep Search investigando EAN: {ean}...")

    prompt = f"""Investiga en internet el siguiente producto alimenticio y determina si es apto para celíacos (libre de gluten).
EAN: {ean}
Nombre aproximado: "{nombre_producto}"
PASOS:
1. Busca el EAN {ean} para identificar el producto exacto.
2. Verifica ingredientes, alérgenos y sellos sin gluten desde la web del fabricante o tiendas oficiales.
3. Si el fabricante declara explícitamente "sin gluten" o "gluten free", marca APTO con confianza alta.
4. Si hay duda razonable sobre contaminación cruzada o ingredientes ambiguos, marca DUDOSO.
5. Si contiene gluten confirmado, marca NO_APTO.
6. Busca también la imagen oficial del producto en la web del fabricante o tienda.
Responde ÚNICAMENTE con este JSON válido, sin texto adicional:
{{
    "encontrado": true,
    "nombre": "Nombre real del producto",
    "marca": "Marca del fabricante",
    "imagen_url": "URL directa a imagen del producto o null si no encuentras",
    "es_apto": true,
    "estado": "APTO",
    "justificacion": "URL fuente + razón breve basada en ingredientes reales encontrados",
    "confianza": "alta"
}}
Los valores posibles de estado son: APTO, NO_APTO, DUDOSO.
Si no encuentras el producto, devuelve encontrado: false y estado: DUDOSO."""

    payload = {
        "model": "sonar",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(PERPLEXITY_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        raw_content = response.json()["choices"][0]["message"]["content"]
        print(f"\n[DEBUG] Respuesta RAW:\n{raw_content}")

        start = raw_content.find("{")
        end = raw_content.rfind("}")
        if start != -1 and end != -1:
            return json.loads(raw_content[start : end + 1])
        else:
            raise ValueError("No se encontró JSON en la respuesta")

    except Exception as e:
        print(f"\n❌ Error IA: {e}")
        return {
            "encontrado": False,
            "estado": "DUDOSO",
            "es_apto": False,
            "imagen_url": None,
            "justificacion": "Error técnico IA",
            "confianza": "baja",
        }

# Análisis por imagen usando sonar-pro

def consultar_ia_vision_imagen(imagen_base64: str, ean: str = "") -> dict:
    """
    Manda la imagen directamente a sonar-pro que la procesa de forma nativa.
    No requiere ninguna dependencia extra.
    """
    print(f"\n📷 Analizando imagen con sonar-pro (EAN ref: '{ean}')...")

    referencia_ean = f"EAN de referencia: {ean}." if ean else ""

    prompt = f"""Eres un experto en celiaquía y alergias alimentarias.
El usuario tiene en sus manos un producto y te manda una foto porque quiere saber si es apto para celíacos.
{referencia_ean}

TAREA:
1. Identifica el producto por su imagen: nombre, marca, logotipo, texto visible en el envase.
2. Lee la lista de ingredientes si es visible en la imagen.
3. Busca en internet información adicional sobre este producto si lo identificas.
4. Determina si contiene gluten: trigo, cebada, centeno, espelta, kamut, triticale, malta, bulgur, seitán o derivados.
5. También detecta trazas declaradas: "puede contener trazas de gluten/trigo".

CRITERIOS:
- APTO: No hay gluten visible ni trazas declaradas
- NO_APTO: Contiene ingrediente con gluten confirmado
- DUDOSO: No puedes leer los ingredientes con claridad, o hay ambigüedad

Responde ÚNICAMENTE con este JSON válido, sin texto adicional:
{{
    "encontrado": true,
    "nombre": "Nombre del producto identificado",
    "marca": "Marca del fabricante",
    "imagen_url": "URL oficial del producto si la encuentras en internet, o null",
    "ingredientes": "Lista de ingredientes leída de la imagen, o null si no son visibles",
    "es_apto": true,
    "estado": "APTO",
    "justificacion": "Razón basada en los ingredientes leídos de la imagen",
    "confianza": "alta",
    "analizado_por": "vision"
}}
Los valores posibles de estado son: APTO, NO_APTO, DUDOSO.
Si no puedes identificar el producto con claridad, devuelve encontrado: false y estado: DUDOSO."""

    payload = {
        "model": "sonar-pro",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{imagen_base64}"
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        "temperature": 0.1,
    }
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(PERPLEXITY_URL, json=payload, headers=headers, timeout=60)
        response.raise_for_status()
        raw_content = response.json()["choices"][0]["message"]["content"]
        print(f"\n[DEBUG Vision] Respuesta RAW:\n{raw_content}")

        start = raw_content.find("{")
        end = raw_content.rfind("}")
        if start != -1 and end != -1:
            resultado = json.loads(raw_content[start : end + 1])
            resultado["analizado_por"] = "vision"
            return resultado
        else:
            raise ValueError("No se encontró JSON en la respuesta de sonar-pro")

    except requests.exceptions.Timeout:
        print("\n❌ Timeout en sonar-pro Vision")
        return _error_vision("Tiempo de respuesta agotado. Inténtalo de nuevo.")

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else 0
        print(f"\n❌ HTTP Error sonar-pro: {status_code} — {e.response.text if e.response else ''}")
        if status_code == 400:
            return _error_vision(
                "La imagen no pudo procesarse. Asegúrate de enfocar bien la etiqueta."
            )
        return _error_vision(f"Error del servidor de IA ({status_code}).")

    except Exception as e:
        print(f"\n❌ Error inesperado Vision: {e}")
        return _error_vision("Error técnico al analizar la imagen.")


def _error_vision(motivo: str) -> dict:
    return {
        "encontrado": False,
        "nombre": None,
        "marca": None,
        "imagen_url": None,
        "ingredientes": None,
        "es_apto": False,
        "estado": "DUDOSO",
        "justificacion": motivo,
        "confianza": "baja",
        "analizado_por": "vision",
    }