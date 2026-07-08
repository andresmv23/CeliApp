import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner';
import FotoAnalisis from './FotoAnalisis';
import SectionReviews from './SectionReviews';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const DEMO_RESULTS = {
  apto: {
    producto: { nombre: 'Queso Crema Light Hacendado', marca: 'Hacendado', ingredientes: 'Leche pasteurizada, nata, proteínas de leche, sal, corrector de acidez (ácido cítrico), espesantes (goma guar, goma xantana). Sin gluten. Sin trazas declaradas.' },
    analisis: { es_apto: true, motivo: 'No contiene gluten ni trazas declaradas en etiqueta.' },
    fuente: 'OpenFoodFacts',
  },
  noapto: {
    producto: { nombre: 'Príncipe Galletas de Chocolate', marca: 'LU', ingredientes: 'Harina de trigo, azúcar, aceite de palma, cacao en polvo (7%), suero de leche, sal, gasificante (carbonato de sodio). Contiene GLUTEN (trigo).' },
    analisis: { es_apto: false, motivo: 'Contiene harina de trigo. Ingrediente con gluten directo.' },
    fuente: 'OpenFoodFacts',
  },
  dudoso: {
    producto: { nombre: 'Orbit Spearmint Sugar Free', marca: 'Wrigley', ingredientes: 'Edulcorantes (sorbitol, manitol, maltitol), goma base, aromas, estabilizador (goma arábiga). Posibles trazas de gluten no confirmadas.' },
    analisis: { es_apto: null, motivo: 'Trazas de gluten no confirmadas. Consulta con tu médico.' },
    fuente: 'OpenFoodFacts',
  },
};

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
  const [demoMode, setDemoMode]           = useState(false);
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
    const q = ean.trim().toLowerCase();

    const runDemo = async (data) => {
      await new Promise(r => setTimeout(r, 900));
      setResultado(data); setDemoMode(true); setLoading(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    };

    if (q === 'demo' || q === 'apto')   return runDemo(DEMO_RESULTS.apto);
    if (q === 'noapto' || q === 'malo') return runDemo(DEMO_RESULTS.noapto);
    if (q === 'dudoso')                 return runDemo(DEMO_RESULTS.dudoso);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_URL}/producto/${ean}`, { headers });
      setResultado(res.data); setDemoMode(false);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (err) {
      if      (err.response?.status === 401) setError('Sesión caducada. Vuelve a entrar.');
      else if (err.response?.status === 404) setError('Producto no encontrado. Prueba: demo · noapto · dudoso');
      else if (err.response?.status === 429) setError('Límite alcanzado. Espera un momento.');
      else                                   setError('Sin conexión al servidor. Prueba: demo · noapto · dudoso');
    } finally { setLoading(false); }
  };

  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token)     { showToast('Inicia sesión para guardar favoritos'); return; }
    if (esFavorito) { showToast('Ya está en tus favoritos'); return; }
    if (demoMode)   { setEsFavorito(true); showToast('Añadido a favoritos'); return; }
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
  };

  const urlFuente = resultado?.analisis?.url_fuente || resultado?.producto?.url_fuente || null;
  const fuenteTexto = fuenteLabel[resultado?.fuente] ?? resultado?.fuente ?? 'Desconocida';

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

            {/* Formulario búsqueda — pill en desktop, stacked en móvil */}
            <form className="reveal search-form" onSubmit={buscarProducto} style={{ maxWidth: '580px', marginBottom: '1rem', transitionDelay: '0.20s' }}>
              <div className="search-inner" style={{
                display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.375rem',
                borderRadius: '9999px', background: '#fff',
                border: `1.5px solid ${BORDER}`,
                boxShadow: '0 2px 12px rgba(13,31,20,0.05)',
              }}>
                <span style={{ paddingLeft: '0.875rem', color: 'rgba(13,31,20,0.25)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Código EAN · demo · noapto · dudoso"
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
                <button type="submit" disabled={loading || !ean.trim()}
                  style={{ padding: '0.75rem 1.375rem', borderRadius: '9999px', background: loading || !ean.trim() ? 'rgba(22,163,74,0.30)' : PRIMARY, color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: loading || !ean.trim() ? 'not-allowed' : 'pointer', transition: 'background 180ms ease', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap', flexShrink: 0 }}
                  onMouseEnter={e => { if (!loading && ean.trim()) e.currentTarget.style.background = PRI_HOV; }}
                  onMouseLeave={e => { if (!loading && ean.trim()) e.currentTarget.style.background = PRIMARY; }}
                >
                  {loading ? (
                    <><svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Analizando…</>
                  ) : 'Verificar'}
                </button>
              </div>
            </form>

            {error && (
              <div style={{ maxWidth: '580px', padding: '0.875rem 1rem', borderRadius: '0.875rem', background: 'rgba(220,38,38,0.05)', border: '1px solid rgba(220,38,38,0.14)', color: '#dc2626', fontSize: '0.875rem', display: 'flex', gap: '0.625rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginTop: '1px', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '2.5rem', transitionDelay: '0.26s' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.45)', fontWeight: 500 }}>Recientes:</span>
              {['Avena Quaker', 'Maizena', 'Pan Bimbo'].map(label => (
                <button key={label} onClick={() => setEan(label)}
                  style={{ padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 500, fontFamily: 'inherit', background: '#fff', border: `1px solid ${BORDER}`, color: 'rgba(13,31,20,0.65)', cursor: 'pointer', transition: 'border-color 160ms ease, box-shadow 160ms ease' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `rgba(22,163,74,0.35)`; e.currentTarget.style.boxShadow = `0 2px 8px rgba(22,163,74,0.07)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="reveal hero-stats" style={{ transitionDelay: '0.32s' }}>
              <p style={{
                fontSize: '0.8125rem',
                color: 'rgba(13,31,20,0.42)',
                fontWeight: 500,
                letterSpacing: '0.01em',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.25rem 1.5rem',
              }}>
                <span>+50.000 productos analizados</span>
                <span className="stat-dot" style={{ color: BORDER }}>·</span>
                <span>99% de precisión</span>
                <span className="stat-dot" style={{ color: BORDER }}>·</span>
                <span>Gratis, sin suscripción</span>
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ══════════════════ RESULTADO ══════════════════ */}
        {resultado && !loading && cfg && (
          <section ref={resultRef} style={{ background: BG, paddingTop: '3rem', paddingBottom: '3rem' }}>
            <div style={container}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(13,31,20,0.45)', marginBottom: '1.5rem' }}>Resultado del análisis</p>
              <div style={{ maxWidth: '640px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 8px 40px rgba(13,31,20,0.07)', border: `1px solid ${BORDER}` }}>
                <div style={{ padding: '1.25rem', background: `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem', flexShrink: 0 }}>{cfg.icon}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: cfg.text }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: cfg.text, opacity: 0.85, marginBottom: '0.75rem' }}>{resultado.analisis?.motivo ?? 'Análisis no disponible'}</p>
                    <div style={{ opacity: 0.7 }}>
                      <span style={{ fontSize: '0.75rem', color: cfg.text }}>Fuente: {fuenteTexto}</span>
                      {urlFuente && (<>{' · '}<a href={urlFuente} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: cfg.text, textDecoration: 'underline' }}>Ver fuente original</a></>)}
                    </div>
                  </div>
                  <button onClick={toggleFavorito}
                    style={{ flexShrink: 0, width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', transition: 'transform 180ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {esFavorito
                      ? <svg width="16" height="16" fill="#dc2626" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                      : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(13,31,20,0.32)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    }
                  </button>
                </div>

                <div style={{ background: '#fff' }}>
                  {resultado.producto?.imagen_url && (
                    <div style={{ width: '100%', height: '220px', position: 'relative', overflow: 'hidden', borderBottom: `1px solid ${BORDER}` }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resultado.producto.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.9) saturate(0.5)', transform: 'scale(1.15)', opacity: 0.35 }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(247,250,248,0.3) 0%, rgba(247,250,248,0.5) 100%)' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
                        <img src={resultado.producto.imagen_url} alt={resultado.producto?.nombre ?? 'Producto'}
                          style={{ maxHeight: '180px', maxWidth: '80%', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.14))', position: 'relative', zIndex: 1 }}
                          onError={e => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }} />
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '1.25rem' }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: TEXT, lineHeight: 1.25, marginBottom: '0.375rem' }}>{resultado.producto?.nombre ?? 'Producto sin nombre'}</h2>
                    <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(13,31,20,0.50)', background: 'rgba(13,31,20,0.05)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.25rem' }}>
                      {resultado.producto?.marca ?? 'Marca desconocida'}
                    </span>

                    <div style={{ borderRadius: '0.875rem', padding: '1rem', background: BG, marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(13,31,20,0.45)', marginBottom: '0.5rem' }}>Ingredientes</p>
                      <p style={{ fontSize: '0.8125rem', lineHeight: 1.65, color: 'rgba(13,31,20,0.80)' }}>{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                    </div>

                    {wrongCount === 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(13,31,20,0.03)', border: `1px solid rgba(13,31,20,0.06)`, marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.55)' }}>¿El resultado no corresponde al producto que tienes?</p>
                        <button onClick={handleWrongProduct}
                          style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(13,31,20,0.45)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', transition: 'color 180ms ease' }}
                          onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,31,20,0.45)'}
                        >No es mi producto</button>
                      </div>
                    ) : (
                      <div style={{ borderRadius: '1rem', overflow: 'hidden', border: `1px solid rgba(22,163,74,0.18)`, background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', marginBottom: '1rem' }}>
                        <div style={{ padding: '1.25rem' }}>
                          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'rgba(22,163,74,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={PRIMARY} strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontWeight: 800, color: TEXT, fontSize: '0.875rem', marginBottom: '0.25rem' }}>¿Quieres un análisis más preciso?</p>
                              <p style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.65)', lineHeight: 1.55 }}>Haz una foto a la etiqueta de ingredientes o al frente del envase. Nuestra IA lo identificará visualmente.</p>
                            </div>
                          </div>
                          <button onClick={() => setFotoOpen(true)}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', background: PRIMARY, color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: `0 4px 16px rgba(22,163,74,0.22)`, transition: 'background 180ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = PRI_HOV}
                            onMouseLeave={e => e.currentTarget.style.background = PRIMARY}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                            </svg>
                            Analizar con foto del producto
                          </button>
                        </div>
                        <div style={{ padding: '0 1.25rem 1rem' }}>
                          <button onClick={() => setWrongCount(0)}
                            style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 180ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(13,31,20,0.75)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,31,20,0.45)'}
                          >No, el resultado es correcto</button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => { setResultado(null); setEan(''); setWrongCount(0); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(13,31,20,0.45)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 180ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(13,31,20,0.45)'}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                      </svg>
                      Nueva búsqueda
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <SectionDivider />

        {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
        <section className="section-pad" style={{ background: BG_ALT }} id="como-funciona">
          <div style={container}>
            <div className="reveal" style={{ marginBottom: '2.5rem', maxWidth: '520px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: PRIMARY, marginBottom: '0.75rem' }}>Cómo funciona</p>
              <h2 style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Tres pasos.<br />Resultado inmediato.</h2>
            </div>

            {/* Grid de 3 — colapsa a 1 col en móvil */}
            <div className="steps-grid" style={{ background: BORDER, borderRadius: '1.25rem', overflow: 'hidden' }}>
              {[
                { num: '01', titulo: 'Introduce el código', desc: 'Escribe manualmente el código EAN o usa la cámara para escanearlo directamente desde el envase.' },
                { num: '02', titulo: 'La IA lo analiza', desc: 'Nuestra IA revisa cada ingrediente, aditivo y posible traza de gluten en segundos.' },
                { num: '03', titulo: 'Respuesta clara', desc: 'Recibes APTO, NO APTO o DUDOSO con la explicación exacta del motivo.' },
              ].map(({ num, titulo, desc }) => (
                <div key={num} className="reveal step-card" style={{ padding: '1.75rem 1.5rem', background: '#fff' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', color: PRIMARY, textTransform: 'uppercase', marginBottom: '1rem' }}>{num}</span>
                  <h3 style={{ fontWeight: 700, color: TEXT, fontSize: '1rem', lineHeight: 1.3, marginBottom: '0.5rem' }}>{titulo}</h3>
                  <p style={{ color: MUTED, fontSize: '0.875rem', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        {/* ══════════════════ REVIEWS ══════════════════ */}
        <SectionReviews />

        <TickerBand />

        {/* ══════════════════ CONTACTO ══════════════════ */}
        <section className="section-pad" style={{ background: BG }} id="sobre-celiapp">
          <div style={container}>
            <div className="contact-grid">
              <div className="reveal">
                <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: PRIMARY, marginBottom: '0.75rem' }}>Contacto</p>
                <h2 style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>¿Tienes alguna<br />pregunta?</h2>
                <p style={{ color: MUTED, fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '2rem' }}>Estamos aquí para ayudarte. Si tienes dudas sobre un producto, quieres reportar un error o simplemente quieres saber más, escríbenos.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {[
                    { label: 'Email', val: 'hola@celiapp.es' },
                    { label: 'Ubicación', val: 'Barcelona, España' },
                    { label: 'Respuesta en', val: 'menos de 24 horas' },
                  ].map(c => (
                    <div key={c.label}>
                      <p style={{ fontSize: '0.72rem', color: MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>{c.label}</p>
                      <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: TEXT }}>{c.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reveal" style={{ borderRadius: '1.25rem', padding: '1.5rem', background: '#fff', boxShadow: '0 4px 24px rgba(13,31,20,0.06)', border: `1px solid ${BORDER}` }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={e => { e.preventDefault(); showToast('✓ Mensaje enviado. Te respondemos pronto.'); e.target.reset(); }}>
                  {/* Nombre y Email en 2 cols en desktop, 1 en móvil */}
                  <div className="form-row">
                    {[{ label: 'Nombre', type: 'text', ph: 'Tu nombre' }, { label: 'Email', type: 'email', ph: 'tu@email.com' }].map(f => (
                      <div key={f.label}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                        <input type={f.type} placeholder={f.ph} required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem', border: `1px solid ${BORDER}`, background: BG, fontSize: '0.875rem', fontFamily: 'inherit', color: TEXT, outline: 'none', transition: 'border-color 160ms ease', boxSizing: 'border-box' }}
                          onFocus={e => e.currentTarget.style.borderColor = `rgba(22,163,74,0.45)`}
                          onBlur={e => e.currentTarget.style.borderColor = BORDER}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Asunto</label>
                    <select style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem', border: `1px solid ${BORDER}`, background: BG, fontSize: '0.875rem', fontFamily: 'inherit', color: TEXT, outline: 'none', appearance: 'none', boxSizing: 'border-box' }}>
                      <option>Duda sobre un producto</option>
                      <option>Reportar un error</option>
                      <option>Sugerencia de mejora</option>
                      <option>Colaboración</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: MUTED, display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mensaje</label>
                    <textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem', border: `1px solid ${BORDER}`, background: BG, fontSize: '0.875rem', fontFamily: 'inherit', color: TEXT, outline: 'none', resize: 'none', transition: 'border-color 160ms ease', boxSizing: 'border-box' }}
                      onFocus={e => e.currentTarget.style.borderColor = `rgba(22,163,74,0.45)`}
                      onBlur={e => e.currentTarget.style.borderColor = BORDER}
                    />
                  </div>
                  <button type="submit"
                    style={{ padding: '0.875rem', borderRadius: '0.625rem', background: PRIMARY, color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 180ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = PRI_HOV}
                    onMouseLeave={e => e.currentTarget.style.background = PRIMARY}
                  >Enviar mensaje</button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════ FOOTER ══════════════════ */}
        <footer style={{ background: BG }}>
          <div style={{ width: '100%', height: '1px', background: BORDER }} />
          <div style={{ ...container, paddingTop: '3rem', paddingBottom: '2.5rem' }}>
            <div className="footer-grid" style={{ marginBottom: '2.5rem', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <rect width="32" height="32" rx="9" fill="#16a34a" />
                    <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                    <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                    <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                    <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                    <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
                  </svg>
                  <span style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontWeight: 700, color: TEXT, fontSize: '1rem' }}>CeliApp</span>
                </div>
                <p style={{ fontSize: '0.875rem', color: MUTED, lineHeight: 1.65, maxWidth: '220px', marginBottom: '1.25rem' }}>
                  Análisis de gluten al instante. Para que comer bien no sea una aventura.
                </p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', background: 'rgba(22,163,74,0.08)', color: PRIMARY, border: '1px solid rgba(22,163,74,0.20)' }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5.5" stroke={PRIMARY} strokeWidth="1" />
                    <path d="M3.5 6l1.8 1.8L8.5 4.2" stroke={PRIMARY} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sin gluten verificado
                </span>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(13,31,20,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '1rem' }}>Producto</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {['Cómo funciona', 'Verificar producto', 'Análisis por foto', 'Favoritos'].map(l => (
                    <a key={l} href="#" style={{ fontSize: '0.875rem', color: MUTED, textDecoration: 'none', transition: 'color 180ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = TEXT}
                      onMouseLeave={e => e.currentTarget.style.color = MUTED}
                    >{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(13,31,20,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '1rem' }}>Empresa</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {['Sobre CeliApp', 'Contacto', 'Blog', 'Colaboraciones'].map(l => (
                    <a key={l} href="#sobre-celiapp" style={{ fontSize: '0.875rem', color: MUTED, textDecoration: 'none', transition: 'color 180ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = TEXT}
                      onMouseLeave={e => e.currentTarget.style.color = MUTED}
                    >{l}</a>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(13,31,20,0.38)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '1rem' }}>Legal</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {['Privacidad', 'Términos de uso', 'Cookies', 'Aviso legal'].map(l => (
                    <a key={l} href="#" style={{ fontSize: '0.875rem', color: MUTED, textDecoration: 'none', transition: 'color 180ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = TEXT}
                      onMouseLeave={e => e.currentTarget.style.color = MUTED}
                    >{l}</a>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ height: '1px', background: BORDER, marginBottom: '1.5rem' }} />
            <div className="footer-bottom">
              <span style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.38)' }}>© 2026 CeliApp — Hecho con cuidado en Barcelona, España</span>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(13,31,20,0.32)' }}>No sustituye el consejo médico. Verifica siempre el etiquetado.</span>
            </div>
          </div>
        </footer>

        {toastMsg && (
          <div style={{ position: 'fixed', bottom: '1rem', right: '1rem', left: '1rem', zIndex: 50 }} className="toast-wrapper">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: '#0D1F14', color: '#F7FAF8', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(13,31,20,0.22)' }}>
              <span style={{ flex: 1 }}>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} style={{ color: 'rgba(247,250,248,0.4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }

          /* Reveal animation */
          .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.55s ease, transform 0.55s ease; }
          .reveal.visible { opacity: 1; transform: none; }

          /* Hero padding */
          .section-hero { padding-top: 5rem; padding-bottom: 5.5rem; }

          /* Secciones padding genérico */
          .section-pad { padding-top: 5rem; padding-bottom: 5.5rem; }

          /* Steps grid — 3 cols desktop, 1 col móvil */
          .steps-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; }

          /* Contacto grid — 2 cols desktop, 1 col móvil */
          .contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: clamp(2rem, 5vw, 4rem); align-items: start; }

          /* Formulario contacto — 2 cols nombre/email */
          .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

          /* Footer grid — 4 cols desktop */
          .footer-grid { display: grid; grid-template-columns: minmax(180px, 1.5fr) repeat(3, 1fr); gap: 2rem; }

          /* Footer bottom — fila en desktop */
          .footer-bottom { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }

          /* Toast — centrado en móvil */
          .toast-wrapper { left: 1rem; right: 1rem; bottom: 1rem; }

          /* ═══════════ TABLET (≤ 768px) ═══════════ */
          @media (max-width: 768px) {
            .section-hero { padding-top: 3rem; padding-bottom: 3.5rem; }
            .section-pad  { padding-top: 3.5rem; padding-bottom: 3.5rem; }
            .steps-grid   { grid-template-columns: 1fr; }
            .footer-grid  { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
            .form-row     { grid-template-columns: 1fr; }
          }

          /* ═══════════ MÓVIL (≤ 480px) ═══════════ */
          @media (max-width: 480px) {
            .section-hero { padding-top: 2.5rem; padding-bottom: 2.5rem; }
            .section-pad  { padding-top: 2.5rem; padding-bottom: 2.5rem; }
            .footer-grid  { grid-template-columns: 1fr; }
            .footer-bottom { flex-direction: column; align-items: flex-start; }
            .toast-wrapper { left: 0.75rem; right: 0.75rem; bottom: 0.75rem; }
            /* Buscador pill → stacked */
            .search-inner { flex-wrap: wrap; border-radius: 1rem !important; padding: 0.5rem !important; gap: 0 !important; }
            .search-inner input { width: 100%; order: 1; padding: 0.625rem 0.5rem !important; }
            .search-inner span:first-child { order: 0; }
            .search-inner button[type="button"] { order: 2; margin-left: auto; }
            .search-inner button[type="submit"] { order: 3; width: 100%; justify-content: center; border-radius: 0.625rem !important; margin-top: 0.375rem; }
            .stat-dot { display: none; }
          }
        `}</style>
      </div>
    </>
  );
}
