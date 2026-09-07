import requests
from .schemas import ProductoOFF

def _detectar_gluten_off(producto: dict) -> str | None:
    """
    Interpreta los campos de Open Food Facts para determinar el estado de gluten.
    Devuelve:
      'SIN_GLUTEN'  → OFF declara explícitamente que no contiene gluten
      'CON_GLUTEN'  → OFF confirma que contiene gluten
      None          → OFF no tiene información suficiente → pasar a IA
    """
    labels = [l.lower() for l in producto.get("labels_tags", [])]
    allergens = [a.lower() for a in producto.get("allergens_tags", [])]
    traces = [t.lower() for t in producto.get("traces_tags", [])]

    # Sin gluten declarado explícitamente
    sin_gluten_labels = {"en:no-gluten", "en:gluten-free", "es:sin-gluten", "fr:sans-gluten"}
    if any(l in sin_gluten_labels for l in labels):
        return "SIN_GLUTEN"

    # Contiene gluten confirmado en alérgenos
    if any("gluten" in a or "wheat" in a or "barley" in a or "rye" in a for a in allergens):
        return "CON_GLUTEN"

    # Trazas de gluten → no es apto para celíacos
    if any("gluten" in t or "wheat" in t for t in traces):
        return "CON_GLUTEN"

    return None  # OFF no sabe


def obtener_producto_por_ean(ean: str):
    """
    Consulta la API de Open Food Facts.
    Extrae: Nombre, Marca, Categorías, Ingredientes, Trazas, datos de gluten.
    """
    url = f"https://world.openfoodfacts.org/api/v0/product/{ean}.json"
    headers = {"User-Agent": "CeliApp - Android - Version 1.0"}

    try:
        respuesta = requests.get(url, headers=headers, timeout=10)
        datos = respuesta.json()

        if datos.get("status") == 1:
            producto = datos["product"]
            nombre = (
                producto.get("product_name_es")
                or producto.get("product_name")
                or "Desconocido"
            )
            marca = producto.get("brands", "Marca desconocida")
            cats_raw = producto.get("categories", "")
            categorias = [c.strip() for c in cats_raw.split(",")] if cats_raw else []
            ingredientes = (
                producto.get("ingredients_text_es")
                or producto.get("ingredients_text")
                or ""
            )
            trazas = (
                producto.get("traces_from_user")
                or producto.get("traces")
                or "No declaradas"
            )
            tags = producto.get("ingredients_tags", [])
            imagen = producto.get("image_front_url", "")
            gluten_segun_off = _detectar_gluten_off(producto)

            # URL real del producto en OFF. Se usa el campo `url` de la API si existe,
            # o se construye con el EAN — sabemos que el producto existe en OFF.
            url_fuente = (
                producto.get("url")
                or f"https://world.openfoodfacts.org/product/{ean}"
            )

            return {
                "encontrado": True,
                "ean": ean,
                "nombre": nombre,
                "marca": marca,
                "categorias": categorias,
                "ingredientes": ingredientes,
                "trazas": trazas,
                "imagen_url": imagen,
                "ingredientes_clave_off": tags,
                "gluten_segun_off": gluten_segun_off,
                "url_fuente": url_fuente,
            }
        else:
            return {"encontrado": False}

    except Exception as e:
        print(f"❌ Error conectando a OFF: {e}")
        return {"encontrado": False, "error": str(e)}

def _detectar_gluten_off_v2(producto_off: dict) -> str:
    """
    Lee los tags de Open Food Facts y devuelve siempre un EstadoGlutenOFF:

    - CON_GLUTEN: OFF indica gluten como alérgeno.
    - TRAZAS: OFF indica posibles trazas de gluten o cereales con gluten.
    - SIN_GLUTEN: OFF incluye una etiqueta explícita sin gluten.
    - NO_INFO: OFF no aporta datos suficientes sobre gluten.

    Ante datos contradictorios, prevalece el riesgo:
    CON_GLUTEN > TRAZAS > SIN_GLUTEN > NO_INFO.
    """
    labels = [tag.lower() for tag in producto_off.get("labels_tags", [])]
    allergens = [tag.lower() for tag in producto_off.get("allergens_tags", [])]
    traces = [tag.lower() for tag in producto_off.get("traces_tags", [])]

    sin_gluten_labels = {
        "en:no-gluten",
        "en:gluten-free",
        "es:sin-gluten",
        "fr:sans-gluten",
    }

    contiene_gluten = any(
        palabra in alergen
        for alergen in allergens
        for palabra in ("gluten", "wheat", "barley", "rye")
    )
    if contiene_gluten:
        return "CON_GLUTEN"

    contiene_trazas = any(
        palabra in traza
        for traza in traces
        for palabra in ("gluten", "wheat", "barley", "rye")
    )
    if contiene_trazas:
        return "TRAZAS"

    if any(label in sin_gluten_labels for label in labels):
        return "SIN_GLUTEN"

    return "NO_INFO"


def obtener_producto_por_ean_v2(ean: str) -> ProductoOFF:
    """
    Consulta Open Food Facts y normaliza los datos que utiliza CeliApp.

    Esta versión no reemplaza a obtener_producto_por_ean todavía.
    Devuelve siempre ProductoOFF, incluso cuando OFF no encuentra el EAN
    o falla la consulta.
    """
    url = f"https://world.openfoodfacts.org/api/v0/product/{ean}.json"
    headers = {"User-Agent": "CeliApp - Android - Version 1.0"}

    try:
        respuesta = requests.get(url, headers=headers, timeout=10)
        respuesta.raise_for_status()
        datos = respuesta.json()

        if datos.get("status") != 1:
            return ProductoOFF(
                encontrado=False,
                ean=ean,
                gluten_segun_off="NO_INFO",
            )

        producto_off = datos.get("product", {})

        nombre = (
            producto_off.get("product_name_es")
            or producto_off.get("product_name")
            or "Desconocido"
        )

        ingredientes = (
            producto_off.get("ingredients_text_es")
            or producto_off.get("ingredients_text")
            or ""
        )

        trazas_declaradas = (
            producto_off.get("traces_from_user")
            or producto_off.get("traces")
            or None
        )

        url_fuente = (
            producto_off.get("url")
            or f"https://world.openfoodfacts.org/product/{ean}"
        )

        return ProductoOFF(
            encontrado=True,
            ean=ean,
            nombre=nombre,
            marca=producto_off.get("brands") or "Marca desconocida",
            ingredientes=ingredientes,
            trazas_declaradas=trazas_declaradas,
            imagen_url=producto_off.get("image_front_url") or None,
            gluten_segun_off=_detectar_gluten_off_v2(producto_off),
            url_fuente=url_fuente,
        )

    except requests.RequestException as error:
        print(f"Error conectando a OFF (v2): {error}")
        return ProductoOFF(
            encontrado=False,
            ean=ean,
            gluten_segun_off="NO_INFO",
        )

    except ValueError as error:
        print(f"Respuesta JSON inválida de OFF (v2): {error}")
        return ProductoOFF(
            encontrado=False,
            ean=ean,
            gluten_segun_off="NO_INFO",
        )