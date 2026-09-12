import requests
from .schemas import ProductoOFF


def _detectar_gluten_off(producto_off: dict) -> str:
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


def obtener_producto_por_ean(ean: str) -> ProductoOFF:
    """
    Consulta Open Food Facts y normaliza los datos que utiliza CeliApp.
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
            gluten_segun_off=_detectar_gluten_off(producto_off),
            url_fuente=url_fuente,
        )

    except requests.RequestException as error:
        print(f"Error conectando a OFF: {error}")
        return ProductoOFF(
            encontrado=False,
            ean=ean,
            gluten_segun_off="NO_INFO",
        )

    except ValueError as error:
        print(f"Respuesta JSON inválida de OFF: {error}")
        return ProductoOFF(
            encontrado=False,
            ean=ean,
            gluten_segun_off="NO_INFO",
        )
