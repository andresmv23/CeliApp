import requests


def obtener_producto_por_ean(ean: str):
    """
    Consulta la API de Open Food Facts.
    Extrae: Nombre, Marca, Categorías, Ingredientes, Trazas e Identificadores técnicos.
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
            }
        else:
            return {"encontrado": False}

    except Exception as e:
        print(f"❌ Error conectando a OFF: {e}")
        return {"encontrado": False, "error": str(e)}
