import requests


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
            }
        else:
            return {"encontrado": False}

    except Exception as e:
        print(f"❌ Error conectando a OFF: {e}")
        return {"encontrado": False, "error": str(e)}
