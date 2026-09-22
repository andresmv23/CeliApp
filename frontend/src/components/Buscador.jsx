import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner';
import FotoAnalisis from './FotoAnalisis';
import HeroBuscador from './HeroBuscador';
import ResultadoProducto from './ResultadoProducto';
import ComoFuncionaPreview from './ComoFuncionaPreview';
import Contacto from './Contacto';
import SectionReviews from './SectionReviews';
import Footer from './Footer';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getStatusConfig(analisis) {
  if (!analisis) return null;
  const byEstado = {
    APTO: { label: 'APTO', bg: 'bg-accent', gradient: 'from-green-50 to-green-100', text: 'text-green-950', icon: '✓' },
    NO_APTO: { label: 'NO APTO', bg: 'bg-noapto', gradient: 'from-rose-50 to-rose-100', text: 'text-rose-900', icon: '✕' },
    TRAZAS: { label: 'NO APTO', bg: 'bg-noapto', gradient: 'from-rose-50 to-rose-100', text: 'text-rose-900', icon: '✕' },
    DUDOSO: { label: 'DUDOSO', bg: 'bg-dudoso', gradient: 'from-amber-50 to-amber-100', text: 'text-amber-900', icon: '?' },
    SIN_GLUTEN_NO_CERTIFICADO: { label: 'DUDOSO', bg: 'bg-dudoso', gradient: 'from-amber-50 to-amber-100', text: 'text-amber-900', icon: '?' },
  };
  if (analisis.estado && byEstado[analisis.estado]) return byEstado[analisis.estado];
  if (analisis.es_apto === null || analisis.es_apto === undefined) return byEstado.DUDOSO;
  return analisis.es_apto ? byEstado.APTO : byEstado.NO_APTO;
}

function useReveal() {
  useEffect(() => { const elements = document.querySelectorAll('.reveal'); const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add('visible'); }), { threshold: 0.12 }); elements.forEach((element) => observer.observe(element)); return () => observer.disconnect(); }, []);
}

function SectionDivider() { return <div aria-hidden="true" className="h-px shrink-0 bg-[linear-gradient(90deg,transparent_0%,rgba(13,31,20,0.10)_20%,rgba(13,31,20,0.10)_80%,transparent_100%)]" />; }
function TickerBand() { const items = Array(12).fill('SIN GLUTEN · CELIAPP ·'); return <div className="mx-auto my-8 max-w-[1120px] px-4"><div className="overflow-hidden py-2.5"><div className="flex animate-[ticker_22s_linear_infinite] gap-6 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-ink/20">{items.map((item, index) => <span key={index}>{item}</span>)}</div></div></div>; }

export default function Buscador() {
  const { token } = useAuth(); const [ean, setEan] = useState(''); const [resultado, setResultado] = useState(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(null); const [busquedaCompletada, setBusquedaCompletada] = useState(false); const [esFavorito, setEsFavorito] = useState(false); const [toastMsg, setToastMsg] = useState(''); const [scannerOpen, setScannerOpen] = useState(false); const [fotoOpen, setFotoOpen] = useState(false); const resultRef = useRef(null); useReveal();
  const showToast = (message) => { setToastMsg(message); setTimeout(() => setToastMsg(''), 3500); };
  const buscarProducto = async (event) => { event?.preventDefault(); if (!ean.trim()) return; setLoading(true); setError(null); setResultado(null); setEsFavorito(false); setBusquedaCompletada(false); try { const headers = token ? { Authorization: `Bearer ${token}` } : {}; const response = await axios.get(`${API_URL}/producto/${ean}`, { headers }); setResultado(response.data); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } catch (requestError) { if (requestError.response?.status === 401) setError('Sesión caducada. Vuelve a entrar.'); else if (requestError.response?.status === 404) setError('Producto no encontrado.'); else if (requestError.response?.status === 429) setError('Límite alcanzado. Espera un momento.'); else setError('Sin conexión al servidor.'); } finally { setLoading(false); setBusquedaCompletada(true); } };
  const toggleFavorito = async () => { if (!resultado) return; if (!token) { showToast('Inicia sesión para guardar favoritos'); return; } if (esFavorito) { showToast('Ya está en tus favoritos'); return; } try { await axios.post(`${API_URL}/favoritos`, { ean }, { headers: { Authorization: `Bearer ${token}` } }); setEsFavorito(true); showToast('Añadido a favoritos'); } catch { showToast('No se pudo guardar el favorito'); } };
  const handleFotoResult = (data) => { setFotoOpen(false); setResultado(data); setEsFavorito(false); showToast('✓ Análisis por imagen completado'); setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); };
  const cfg = getStatusConfig(resultado?.analisis); const fuenteLabel = { BASE_DE_DATOS_PROPIA: 'Base de datos propia', OPEN_FOOD_FACTS: 'Open Food Facts', OFF_DIRECTO: 'Open Food Facts', OFF_ANALISIS_RAPIDO: 'Open Food Facts', OFF_VALIDADO_IA: 'OFF + IA', OFF_SIN_DATOS_GLUTEN: 'Open Food Facts', IA_PERPLEXITY: 'IA Perplexity', IA_GENERADA: 'IA Perplexity', IA_VISION: 'IA Vision', NO_ENCONTRADO: 'Sin fuente', BD_LOCAL: 'Base de datos local', ANALISIS_INGREDIENTES: 'Análisis de ingredientes', WEB_FABRICANTE: 'Web del fabricante', WEB_TERCEROS: 'Fuentes web', SIN_FUENTE_CONFIRMADA: 'Sin fuente confirmada' }; const urlFuente = resultado?.analisis?.url_info ?? null; const fuenteTexto = fuenteLabel[resultado?.analisis?.fuente] ?? resultado?.analisis?.fuente ?? 'Desconocida';
  return <>{scannerOpen && <Scanner onScanSuccess={(code) => { setEan(code); setScannerOpen(false); setTimeout(() => buscarProducto({ preventDefault: () => {} }), 120); }} onClose={() => setScannerOpen(false)} />}{fotoOpen && <FotoAnalisis ean={ean} onResult={handleFotoResult} onClose={() => setFotoOpen(false)} />}<div className="font-sans text-ink"><HeroBuscador ean={ean} setEan={setEan} loading={loading} error={error} onBuscar={buscarProducto} onAbrirScanner={() => setScannerOpen(true)} /><SectionDivider />{resultado && !loading && cfg && <ResultadoProducto resultado={resultado} cfg={cfg} fuenteTexto={fuenteTexto} urlFuente={urlFuente} esFavorito={esFavorito} onToggleFavorito={toggleFavorito} onAnalizarFoto={() => setFotoOpen(true)} onNuevaBusqueda={() => { setResultado(null); setEan(''); setError(null); setBusquedaCompletada(false); }} resultRef={resultRef} />}<SectionDivider /><ComoFuncionaPreview /><SectionDivider /><SectionReviews /><TickerBand /><Contacto /><Footer />{toastMsg && <div className="fixed inset-x-3 bottom-3 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:w-auto"><div className="flex items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-surface shadow-[0_8px_32px_rgba(13,31,20,0.22)]"><span className="flex-1">{toastMsg}</span><button onClick={() => setToastMsg('')} className="flex shrink-0 text-surface/40 transition hover:text-surface" aria-label="Cerrar notificación">×</button></div></div>}<style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } } .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.55s ease, transform 0.55s ease; } .reveal.visible { opacity: 1; transform: none; }`}</style></div></>;
}
