import json
from typing import Dict, List

GLUTEN_OBVIO = [
    # Español
    "trigo",
    "cebada",
    "centeno",
    "espelta",
    "kamut",
    "triticale",
    "khorasan",
    "seitan",
    "seitán",
    "malta",
    "bulgur",
    "escanda",
    "farro",
    # Inglés
    "wheat",
    "barley",
    "rye",
    "spelt",
    "seitan",
    "malt",
    "bulgur",
    "farro",
    # Derivados específicos inequívocos
    "semolina de trigo",
    "wheat semolina",
    "cuscús de trigo",
    "wheat couscous",
    "harina de trigo",
    "wheat flour",
    "germen de trigo",
    "wheat germ",
    "salvado de trigo",
    "wheat bran",
]


def analisis_rapido(ingredientes: str) -> Dict:
    """
    Analiza el texto de ingredientes.
    1. Si ve 'trigo' -> NO APTO (Rápido).
    2. Si ve 'trazas' -> TRAZAS (Rápido).
    3. Si está limpio -> Pide a IA validación oficial (Web).
    """

    if not ingredientes or len(ingredientes.strip()) < 5:
        return {
            "estado": "DUDOSO",
            "necesita_ia": True,
            "es_apto": False,
            "motivo": "Sin información de ingredientes. Se requiere búsqueda web.",
            "confianza": "baja",
            "ingredientes_dudosos": [],
        }

    texto = ingredientes.lower()

    # FILTRO RÁPIDO DE DETECCIÓN DE PELIGRO OBVIO
    for gluten in GLUTEN_OBVIO:
        if gluten in texto:
            return {
                "estado": "NO_APTO",
                "necesita_ia": False,
                "es_apto": False,
                "motivo": f"Contiene ingrediente prohibido explícito: {gluten}",
                "confianza": "alta",
                "ingredientes_dudosos": [],
            }

    # FILTRO DE TRAZAS
    if (
        "trazas de gluten" in texto
        or "puede contener gluten" in texto
        or "trazas de trigo" in texto
    ):
        return {
            "estado": "TRAZAS",
            "necesita_ia": False,
            "es_apto": False,
            "motivo": "Etiquetado preventivo: Puede contener trazas.",
            "confianza": "alta",
            "ingredientes_dudosos": [],
        }

    return {
        "estado": "DUDOSO",
        "necesita_ia": True,
        "modo_ia": "VALIDACION_OFICIAL",
        "es_apto": False,
        "motivo": "Ingredientes limpios, pero se requiere validación oficial de la marca.",
        "confianza": "media",
        "ingredientes_dudosos": [],
    }
