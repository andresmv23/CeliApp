import os
import json
import requests
import re
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("PERPLEXITY_API_KEY")

client = OpenAI(api_key=API_KEY, base_url="https://api.perplexity.ai")


def consultar_ia_experto_total(ean: str, nombre_producto: str = ""):
    """
    IA EXTERNA (Deep Search - Dict):
    Busca en internet el producto. Devuelve DICCIONARIO Python.
    """
    print(f"🕵️ IA Deep Search investigando EAN: {ean}...")

    query_busqueda = f"producto EAN {ean}"
    if nombre_producto:
        query_busqueda += f" {nombre_producto}"

    url = "https://api.perplexity.ai/chat/completions"

    prompt = f"""
    Tu misión es investigar en internet este producto y determinar si es APTO PARA CELÍACOS, es decir de estar seguros que no tiene gluten o contiene gluten.
    
    OBJETIVO DE BÚSQUEDA: "{query_busqueda}"
    
    INSTRUCCIONES CRÍTICAS:
    1. Busca específicamente el código EAN {ean} y el nombre "{nombre_producto}".
    2. Una vez con el EAN proporcionado y el nombre del producto busca a partir de la marca del fabricante y los sitios donde se venda el producto.
    3. Tienes que estar seguro de que los ingredientes no contienen gluten ni tienen gluten, si dudas busca en la empresa que proporciona los ingredientes.
    4. Si encuentras el producto pero NO tienes certeza de sus ingredientes o sello, marca como DUDOSO.
    5. Si el producto NO es comida (ej: champú), marca NO APTO.

    SI EN EL MISMO PRODUCTO DICE QUE ES SIN GLUTEN ENTONCES MARCALO COMO SIN GLUTEN PORQUE CLARAMENTE LO DICE EL FABRICANTE
    
    Responde SOLO un JSON válido con esta estructura EXACTA Y SOLO CON UN JSON, NO SIN NADA MÁS, CUALQUIER COSA QUE QUIERAS COMENTAR LO COMENTARAS
    EN EL APARTADO DE "justificacion":

    SOBRETODO ASEGURATE QUE EL PRODUCTO QUE BUSCAS ES EL MISMO QUE EL DEL NOMBRE DEL PRODUCTO

    {{
        "encontrado": true,
        "nombre": "Nombre real del producto"(que tiene que coincidir con "{nombre_producto}"),
        "marca": "Marca detectada",
        "es_apto": true/false, 
        "estado": "APTO" | "NO_APTO" | "DUDOSO",
        "justificacion": "URL fuente y breve explicación de por qué es apto/no apto. Incluye ingredientes si los encuentras.",
        "confianza": "alta" | "media" | "baja"
    }}
    """

    payload = {
        "model": "sonar  ",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }

    headers = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()

        raw_content = response.json()["choices"][0]["message"]["content"]
        print(f"🐛 [DEBUG] Respuesta RAW:\n{raw_content}")

        # Extracción robusta con Regex
        match = re.search(r"\{.*\}", raw_content, re.DOTALL)
        if match:
            clean_json = match.group(0)
            return json.loads(clean_json)
        else:
            raise ValueError("No se encontró JSON en la respuesta")

    except Exception as e:
        print(f"❌ Error IA: {e}")
        return {
            "encontrado": False,
            "estado": "DUDOSO",
            "es_apto": False,
            "justificacion": "Error técnico IA",
            "confianza": "baja",
        }
