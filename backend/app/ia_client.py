import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("PERPLEXITY_API_KEY")
PERPLEXITY_URL = "https://api.perplexity.ai/chat/completions"


# ───────────────────────────────────────────────────────────────────────────────
default _call_ia(prompt: str, timeout: int = 25) -> str | None:
    """Llamada genérica a Perplexity sonar. Devuelve el contenido raw o None."""
    try:
        response = requests.post(
            PERPLEXITY_URL,
            json={
                "model": "sonar",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
            },
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=timeout,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"\n\u274c Error IA: {e}")
        return None


def _extraer_json(raw: str) -> dict | None:
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1:
        try:
            return json.loads(raw[start:end + 1])
        except json.JSONDecodeError:
            return None
    return None


# ───────────────────────────────────────────────────────────────────────────────
def encontrar_ingredientes_producto(nombre: str, marca: str) -> str | None:
    """
    Busca la lista de ingredientes oficial de un producto dado su nombre y marca.
    Devuelve la cadena de ingredientes o None si no la encuentra.
    """
    print(f"\n\U0001f9ea [IA] Buscando ingredientes: {marca} - {nombre}")

    prompt = f"""Busca en internet la lista oficial de ingredientes del siguiente producto alimenticio:
Nombre: "{nombre}"
Marca: "{marca}"

INSTRUCCIONES:
- Busca en la web del fabricante, supermercados online (Mercadona, Carrefour, Alcampo, El Corte Ingles, etc.) o bases de datos de alimentos.
- Devuelve los ingredientes tal como aparecen oficialmente en el envase o en la web.
- Si no encuentras este producto concreto con certeza, devuelve null.
- No inventes ni extrapoles ingredientes de productos similares.

Responde UNICAMENTE con este JSON valido, sin texto adicional:
{{"ingredientes": "lista completa de ingredientes o null"}}"""

    raw = _call_ia(prompt)
    if not raw:
        return None

    print(f"\n[DEBUG ingredientes RAW]: {raw}")
    resultado = _extraer_json(raw)
    if not resultado:
        return None

    ingredientes = resultado.get("ingredientes")
    if not ingredientes or len(str(ingredientes).strip()) < 5:
        return None

    return str(ingredientes).strip()


def encontrar_imagen_producto(nombre: str, marca: str) -> str | None:
    """
    Busca una URL de imagen de calidad para un producto dado su nombre y marca.
    Devuelve la URL directa a la imagen o None si no la encuentra.
    """
    print(f"\n\U0001f5bc\ufe0f  [IA] Buscando imagen: {marca} - {nombre}")

    prompt = f"""Busca en internet una imagen oficial de buena calidad del siguiente producto alimenticio:
Nombre: "{nombre}"
Marca: "{marca}"

INSTRUCCIONES:
- Busca preferentemente en la web del fabricante, supermercados online o tiendas especializadas.
- Devuelve una URL directa a la imagen del producto (que termine en .jpg, .jpeg, .png, .webp o similar).
- La imagen debe mostrar claramente el envase del producto.
- Si no encuentras una imagen concreta y verificada de este producto, devuelve null.
- No devuelvas URLs de paginas web, solo URLs directas a archivos de imagen.

Responde UNICAMENTE con este JSON valido, sin texto adicional:
{{"imagen_url": "https://... o null"}}"""

    raw = _call_ia(prompt)
    if not raw:
        return None

    print(f"\n[DEBUG imagen RAW]: {raw}")
    resultado = _extraer_json(raw)
    if not resultado:
        return None

    imagen_url = resultado.get("imagen_url")
    if not imagen_url or not str(imagen_url).startswith("http"):
        return None

    return str(imagen_url).strip()


# ───────────────────────────────────────────────────────────────────────────────
def consultar_ia_experto_total(ean: str, nombre_producto: str = "", marca: str = ""):
    print(f"\n\U0001f916 IA Deep Search investigando EAN: {ean}...")

    contexto = ""
    if nombre_producto:
        contexto += f"Nombre del producto: \"{nombre_producto}\".\n"
    if marca:
        contexto += f"Marca: \"{marca}\".\n"

    prompt = f"""Investiga si el siguiente producto alimenticio es apto para celíacos (libre de gluten).
EAN: {ean}
{contexto}
INSTRUCCIONES ESTRICTAS:
- Busca información EXCLUSIVAMENTE sobre este producto con este EAN exacto.
- Si encuentras la página del fabricante, tienda oficial o base de datos con este EAN, extrae si declara "sin gluten", "gluten free", o si lista cualquier cereal con gluten o sus derivados entre sus ingredientes o alérgenos.
- Si el fabricante declara explícitamente "sin gluten" o "gluten free" en el envase o en su web, marca APTO con confianza alta.
- Si los ingredientes o alérgenos contienen cualquier cereal con gluten o sus derivados, marca NO_APTO.
- Si hay trazas declaradas de gluten o cereales con gluten, marca NO_APTO.
- Si no encuentras información específica y verificada sobre ESTE producto exacto, devuelve encontrado: false.
- NUNCA uses productos de nombre similar o de otras marcas como referencia. Solo este EAN.
Responde ÚnicAMENTE con este JSON válido, sin texto adicional:
{{
    "encontrado": true,
    "nombre": "Nombre real del producto",
    "marca": "Marca del fabricante",
    "imagen_url": "URL directa a imagen del producto o null",
    "ingredientes": "Lista completa de ingredientes tal como aparece en el envase o la web, o null",
    "es_apto": true,
    "estado": "APTO",
    "justificacion": "Explica de forma natural y concisa por qué el producto es o no es apto para celíacos, basandote en sus ingredientes reales y declaraciones del fabricante.",
    "url_fuente": "URL de la página web donde encontraste la información",
    "confianza": "alta"
}}
Los valores posibles de estado son: APTO, NO_APTO, DUDOSO.
Si no encuentras información verificada sobre este producto exacto, devuelve encontrado: false y estado: DUDOSO."""

    raw = _call_ia(prompt, timeout=30)
    if not raw:
        return {
            "encontrado": False,
            "estado": "DUDOSO",
            "es_apto": False,
            "imagen_url": None,
            "ingredientes": None,
            "justificacion": "Error técnico IA",
            "url_fuente": None,
            "confianza": "baja",
        }

    print(f"\n[DEBUG] Respuesta RAW:\n{raw}")
    resultado = _extraer_json(raw)
    if resultado:
        return resultado

    return {
        "encontrado": False,
        "estado": "DUDOSO",
        "es_apto": False,
        "imagen_url": None,
        "ingredientes": None,
        "justificacion": "Error técnico IA",
        "url_fuente": None,
        "confianza": "baja",
    }


# ───────────────────────────────────────────────────────────────────────────────
def consultar_ia_vision_imagen(imagen_base64: str, ean: str = "") -> dict:
    print(f"\n\U0001f4f7 Analizando imagen con sonar-pro (EAN ref: '{ean}')...")

    referencia_ean = f"EAN de referencia: {ean}." if ean else ""

    prompt = f"""Eres un experto en celiaquía y alergias alimentarias.
El usuario tiene en sus manos un producto y te manda una foto porque quiere saber si es apto para celíacos.
{referencia_ean}

TAREA:
1. Identifica el producto por su imagen: nombre, marca, logotipo, texto visible en el envase.
2. Lee la lista de ingredientes si es visible en la imagen.
3. Busca en internet información adicional sobre este producto si lo identificas.
4. Determina si contiene gluten: cualquier cereal con gluten (trigo, cebada, centeno, espelta, kamut, triticale, avena contaminada, etc.) o sus derivados (harina, almidón, malta, séitán, etc.).
5. Detecta trazas declaradas: frases como "puede contener trazas de gluten", "elaborado en instalaciones que procesan trigo", etc.
6. Si el envase indica explícitamente "sin gluten" o "gluten free", tenlo muy en cuenta para marcar APTO.

CRITERIOS:
- APTO: No hay gluten ni trazas declaradas, o el fabricante declara explícitamente "sin gluten"
- NO_APTO: Contiene cualquier ingrediente con gluten o trazas declaradas
- DUDOSO: No puedes leer los ingredientes con claridad, o hay ambigüedad real

Responde ÚnicAMENTE con este JSON válido, sin texto adicional:
{{
    "encontrado": true,
    "nombre": "Nombre del producto identificado",
    "marca": "Marca del fabricante",
    "imagen_url": "URL oficial del producto si la encuentras en internet, o null",
    "ingredientes": "Lista de ingredientes leída de la imagen, o null si no son visibles",
    "es_apto": true,
    "estado": "APTO",
    "justificacion": "Explica de forma natural y concisa por qué el producto es o no es apto para celíacos, basándote en sus ingredientes reales y declaraciones del fabricante.",
    "url_fuente": "URL de la página web donde encontraste información adicional, o null",
    "confianza": "alta",
    "analizado_por": "vision"
}}
Los valores posibles de estado son: APTO, NO_APTO, DUDOSO.
Si no puedes identificar el producto con claridad, devuelve encontrado: false y estado: DUDOSO."""

    try:
        response = requests.post(
            PERPLEXITY_URL,
            json={
                "model": "sonar-pro",
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{imagen_base64}"},
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                "temperature": 0.1,
            },
            headers={
                "Authorization": f"Bearer {API_KEY}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        response.raise_for_status()
        raw = response.json()["choices"][0]["message"]["content"]
        print(f"\n[DEBUG Vision] Respuesta RAW:\n{raw}")

        resultado = _extraer_json(raw)
        if resultado:
            resultado["analizado_por"] = "vision"
            return resultado
        raise ValueError("No se encontró JSON en la respuesta de sonar-pro")

    except requests.exceptions.Timeout:
        print("\n\u274c Timeout en sonar-pro Vision")
        return _error_vision("Tiempo de respuesta agotado. Inténtalo de nuevo.")

    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response else 0
        print(f"\n\u274c HTTP Error sonar-pro: {status_code}")
        if status_code == 400:
            return _error_vision("La imagen no pudo procesarse. Asgúrate de enfocar bien la etiqueta.")
        return _error_vision(f"Error del servidor de IA ({status_code}).")

    except Exception as e:
        print(f"\n\u274c Error inesperado Vision: {e}")
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
        "url_fuente": None,
        "confianza": "baja",
        "analizado_por": "vision",
    }
