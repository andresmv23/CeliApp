import re
from typing import Dict
from .schemas import Analisis

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

# Ingredientes que contienen palabras de la lista pero NO son gluten
FALSOS_POSITIVOS = [
    "maltodextrina",
    "maltitol",
    "maltiol",
    "malta de maíz",
    "corn malt",
    "trigo sarraceno",  # sin gluten
    "buckwheat",        # sin gluten
]

def _contiene_gluten(texto: str, gluten: str) -> bool:
    """
    Comprueba si el ingrediente con gluten aparece como palabra completa,
    evitando falsos positivos por substring (ej: 'malt' en 'maltodextrina').
    """
    # Primero descarta si el texto contiene algún falso positivo que englobe la palabra
    for fp in FALSOS_POSITIVOS:
        if fp in texto:
            # Sustituye temporalmente el falso positivo para que no interfiera
            texto = texto.replace(fp, " ")

    # Busca la palabra con word boundary (\b)
    patron = r"\b" + re.escape(gluten) + r"\b"
    return bool(re.search(patron, texto))

def analizar_ingredientes_basico(ingredientes: str) -> Analisis:
    """
    Analiza exclusivamente la lista de ingredientes.

    No analiza trazas, etiquetas de OFF ni información web.
    Las trazas se gestionan fuera, en el orquestador, usando los datos
    estructurados de Open Food Facts o de la fuente correspondiente.
    """

    if not ingredientes or len(ingredientes.strip()) < 5:
        return Analisis(
            es_apto=False,
            estado="DUDOSO",
            motivo=(
                "No hay información suficiente de ingredientes para determinar "
                "si el producto contiene gluten."
            ),
            url_info=None,
            fuente="ANALISIS_INGREDIENTES",
            confianza="baja",
        )

    texto = ingredientes.lower()

    for gluten in GLUTEN_OBVIO:
        if _contiene_gluten(texto, gluten):
            return Analisis(
                es_apto=False,
                estado="NO_APTO",
                motivo=f"Contiene un ingrediente con gluten: {gluten}.",
                url_info=None,
                fuente="ANALISIS_INGREDIENTES",
                confianza="alta",
            )

    return Analisis(
        es_apto=False,
        estado="SIN_GLUTEN_NO_CERTIFICADO",
        motivo=(
            "No se detectan ingredientes con gluten, "
            "pero no existe una confirmación explícita de que sea sin gluten."
        ),
        url_info=None,
        fuente="ANALISIS_INGREDIENTES",
        confianza="baja",
    )

def analisis_rapido(ingredientes: str) -> Dict:
    """
    Analiza el texto de ingredientes.
    1. Si ve gluten como palabra completa -> NO APTO (Rápido).
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
        if _contiene_gluten(texto, gluten):
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
