import os
import json
import requests
import re
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("PERPLEXITY_API_KEY")


def consultar_ia_experto_total(ean: str, nombre_producto: str = ""):
    print(f"🕵️ IA Deep Search investigando EAN: {ean}...")

    url = "https://api.perplexity.ai/chat/completions"

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
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        raw_content = response.json()["choices"][0]["message"]["content"]
        print(f"🐛 [DEBUG] Respuesta RAW:\n{raw_content}")

        start = raw_content.find('{')
        end = raw_content.rfind('}')
        if start != -1 and end != -1:
            clean_json = raw_content[start:end + 1]
            return json.loads(clean_json)
        else:
            raise ValueError("No se encontró JSON en la respuesta")

    except Exception as e:
        print(f"❌ Error IA: {e}")
        return {
            "encontrado": False,
            "estado": "DUDOSO",
            "es_apto": False,
            "imagen_url": None,
            "justificacion": "Error técnico IA",
            "confianza": "baja",
        }