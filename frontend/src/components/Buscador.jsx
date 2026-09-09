import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner';
import FotoAnalisis from './FotoAnalisis';
import SectionReviews from './SectionReviews';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getStatusConfig(analisis) {
  if (!analisis) return null;
  if (analisis.es_apto === null || analisis.es_apto === undefined)
    return { label: 'DUDOSO', bg: '#b45309', gradStart: '#fffbeb', gradEnd: '#fef3c7', text: '#78350f', icon: '?' };
  return analisis.es_apto
    ? { label: 'APTO',    bg: '#16a34a', gradStart: '#f0fdf4', gradEnd: '#dcfce7', text: '#14532d', icon: '✓' }
    : { label: 'NO APTO', bg: '#dc2626', gradStart: '#fff1f2', gradEnd: '#ffe4e6', text: '#7f1d1d', icon: '✕' };
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function SectionDivider() {
  return (
    <div aria-hidden="true" style={{
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, rgba(13,31,20,0.10) 20%, rgba(13,31,20,0.10) 80%, transparent 100%)',
      margin: '0',
      flexShrink: 0,
    }} />
  );
}

function TickerBand() {
  const items = Array(12).fill('SIN GLUTEN · CELIAPP ·');
  return (
    <div style={{ maxWidth: 1120, margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ overflow: 'hidden', padding: '0.6rem 0' }}>
        <div
          className="flex gap-6 whitespace-nowrap"
          style={{
            animation: 'ticker 22s linear infinite',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'rgba(13,31,20,0.18)',
            textTransform: 'uppercase',
          }}
        >
          {items.map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <style>{`@keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </div>
    </div>
  );
}

export default function Buscador() {
  const { token } = useAuth();
  const [ean, setEan]                     = useState('');
  const [resultado, setResultado]         = useState(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [esFavorito, setEsFavorito]       = useState(false);
  const [toastMsg, setToastMsg]           = useState('');
  const [scannerOpen, setScannerOpen]     = useState(false);
  const [fotoOpen, setFotoOpen]           = useState(false);
  const [wrongCount, setWrongCount]       = useState(0);
  const resultRef = useRef(null);

  useReveal();

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3500); };

  const buscarProducto = async (e) => {
    e?.preventDefault();
    if (!ean.trim()) return;
    setLoading(true); setError(null); setResultado(null);
    setEsFavorito(false); setWrongCount(0);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/producto/${ean}`, { headers });
      setResultado(res.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (err) {
      if      (err.response?.status === 401) setError('Sesión caducada. Vuelve a entrar.');
      else if (err.response?.status === 404) setError('Producto no encontrado.');
      else if (err.response?.status === 429) setError('Límite alcanzado. Espera un momento.');
      else                                   setError('Sin conexión al servidor.');
    } finally { setLoading(false); }
  };

  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token)     { showToast('Inicia sesión para guardar favoritos'); return; }
    if (esFavorito) { showToast('Ya está en tus favoritos'); return; }
    try {
      await axios.post(`${API_URL}/favoritos`, { ean }, { headers: { Authorization: `Bearer ${token}` } });
      setEsFavorito(true); showToast('Añadido a favoritos');
    } catch { showToast('No se pudo guardar el favorito'); }
  };

  const handleWrongProduct = () => {
    setWrongCount(c => c + 1);
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleFotoResult = (data) => {
    setFotoOpen(false);
    setResultado(data);
    setWrongCount(0);
    setEsFavorito(false);
    showToast('✓ Análisis por imagen completado');
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const cfg = getStatusConfig(resultado?.analisis);

  const fuenteLabel = {
    BASE_DE_DATOS_PROPIA: 'Base de datos propia',
    OPEN_FOOD_FACTS:      'Open Food Facts',
    OFF_DIRECTO:          'Open Food Facts',
    OFF_ANALISIS_RAPIDO:  'Open Food Facts',
    OFF_VALIDADO_IA:      'OFF + IA',
    OFF_SIN_DATOS_GLUTEN: 'Open Food Facts',
    IA_PERPLEXITY:        'IA Perplexity',
    IA_GENERADA:          'IA Perplexity',
    IA_VISION:            'IA Vision',
    NO_ENCONTRADO:        'Sin fuente',
    BD_LOCAL: 'Base de datos local',
    ANALISIS_INGREDIENTES: 'Análisis de ingredientes',
    WEB_FABRICANTE: 'Web del fabricante',
    WEB_TERCEROS: 'Fuentes web',
    SIN_FUENTE_CONFIRMADA: 'Sin fuente confirmada',
  };

  const urlFuente = resultado?.analisis?.url_info ?? null;

  const fuenteTexto =
    fuenteLabel[resultado?.analisis?.fuente] ??
    resultado?.analisis?.fuente ??
    'Desconocida';
  
  const container = {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '0 1rem',
  };

  const BG      = '#F7FAF8';
  const BG_ALT  = '#F0F4F1';
  const TEXT    = '#0D1F14';
  const MUTED   = '#4B6355';
  const PRIMARY = '#16a34a';
  const PRI_HOV = '#15803d';
  const BORDER  = 'rgba(13,31,20,0.08)';

  return (
    <>
      {scannerOpen && (
        <Scanner
          onScanSuccess={(code) => {
            setEan(code);
            setScannerOpen(false);
            setTimeout(() => buscarProducto({ preventDefault: () => {} }), 120);
          }}
          onClose={() => setScannerOpen(false)}
        />
      )}
      {fotoOpen && (
        <FotoAnalisis
          ean={ean}
          onResult={handleFotoResult}
          onClose={() => setFotoOpen(false)}
        />
      )}

      <div style={{ fontFamily: "var(--font-body, 'DM Sans', system-ui, sans-serif)", color: TEXT }}>

        {/* ══════════════════ HERO ══════════════════ */}
        <section className="section-hero" style={{
          background: BG,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={container}>

            <div className="reveal" style={{ marginBottom: '1.5rem' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.3rem 0.8rem', borderRadius: '9999px',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
                background: 'rgba(22,163,74,0.08)',
                color: PRIMARY,
                border: '1px solid rgba(22,163,74,0.20)',
              }}>
                Beta 1.0 — Gratis
              </span>
            </div>

            <h1 className="reveal" style={{
              fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              fontWeight: 700,
              fontSize: 'clamp(2.2rem, 6vw, 5.5rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: TEXT,
              marginBottom: '1rem',
              maxWidth: '820px',
              transitionDelay: '0.08s',
            }}>
              ¿Es este producto<br />
              <em style={{ fontStyle: 'italic', color: PRIMARY }}>seguro</em>{' '}
              <span style={{ color: 'rgba(13,31,20,0.40)' }}>para ti?</span>
            </h1>

            <p className="reveal" style={{
              fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)',
              color: MUTED,
              lineHeight: 1.7,
              maxWidth: '460px',
              marginBottom: '1.75rem',
              transitionDelay: '0.14s',
            }}>
              Introduce el código de barras y nuestra IA analiza cada ingrediente al instante. Sin dudas, sin riesgos.
            </p>

            <form className="reveal search-form" onSubmit={buscarProducto} style={{ maxWidth: '580px', marginBottom: '1rem', transitionDelay: '0.20s' }}>
              <div className="search-inner" style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem',
                borderRadius: '9999px', background: '#fff',
                border: `1.5px solid ${BORDER}`,
                boxShadow: '0 2px 12px rgba(13,31,20,0.05)',
              }}>
                <span style={{ paddingLeft: '0.875rem', color: 'rgba(13,31,20,0.25)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0 1 14 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Introduce el código EAN"
                  value={ean}
                  onChange={e => setEan(e.target.value)}
                  style={{ flex: 1, minWidth: 0, padding: '0.75rem 0.5rem', background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9375rem', fontFamily: 'inherit', color: TEXT }}
                />
                <button type="button" onClick={() => setScannerOpen(true)} title="Escanear código de barras"
                  style={{ padding: '0.625rem', borderRadius: '9999px', border: 'none', background: 'transparent', color: 'rgba(13,31,20,0.28)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 180ms ease', flexShrink: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,31,20,0.28)'}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0z" />
                  </svg>
                </button>
                <button type="submit" disabled={loading || !ean.trim()}
                  style={{ padding: '0.75rem 1.375rem', borderRadius: '9999px', background: loading || !ean.trim() ? 'rgba(22,163,74,0.30)' : PRIMARY, color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: loading || !ean.trim() ? 'not-allowed' : 'pointer', transition: 'background 180ms ease', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => { if (!loading && ean.trim()) e.currentTarget.style.background = PRI_HOV; }}
                  onMouseLeave={e => { if (!loading && ean.trim()) e.currentTarget.style.background = PRIMARY; }}
                >
                  {loading ? 'Analizando…' : 'Verificar'}
                </button>
              </div>
            </form>

            {error && (
              <div style={{ maxWidth: '580px', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#dc2626', fontSize: '0.875rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', transitionDelay: '0.26s' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.45)', fontWeight: 500 }}>Recientes:</span>
              {['Avena Quaker', 'Maizena', 'Pan Bimbo'].map(label => (
                <button key={label} onClick={() => setEan(label)}
                  style={{ padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'inherit', background: '#fff', border: `1px solid ${BORDER}`, color: 'rgba(13,31,20,0.65)', cursor: 'pointer' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {resultado && !loading && cfg && (
          <section ref={resultRef} style={{ background: BG, paddingTop: '3rem', paddingBottom: '3rem' }}>
            <div style={container}>
              <div style={{ maxWidth: '640px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 8px 40px rgba(13,31,20,0.07)', border: `1px solid ${BORDER}` }}>
                <div style={{ padding: '1.25rem', background: `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})` }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: cfg.text }}>{cfg.label}</span>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: cfg.text }}>{resultado.analisis?.motivo ?? 'Análisis no disponible'}</p>
                  <span style={{ fontSize: '0.75rem', color: cfg.text }}>Fuente: {resultado?.analisis?.fuente ?? 'Desconocida'}</span>
                </div>
                <div style={{ background: '#fff', padding: '1.25rem' }}>
                  <h2>{resultado.producto?.nombre ?? 'Producto sin nombre'}</h2>
                  <p>{resultado.producto?.marca ?? 'Marca desconocida'}</p>
                  <p>{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
