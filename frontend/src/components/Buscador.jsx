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
    ? { label: 'APTO',    bg: '#3d6b50', gradStart: '#f0faf4', gradEnd: '#dcf0e4', text: '#1a3d2b', icon: '✓' }
    : { label: 'NO APTO', bg: '#8b2e2e', gradStart: '#fff1f1', gradEnd: '#fedddd', text: '#6b1a1a', icon: '✕' };
}

/* Hook para animaciones reveal al hacer scroll */
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

  /* Contenedor alineado con la navbar: max-width 1120px */
  const container = {
    maxWidth: '1120px',
    margin: '0 auto',
    padding: '0 1.5rem',
  };

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

      <div style={{ fontFamily: "var(--font-body, 'DM Sans', system-ui, sans-serif)", color: 'var(--color-text, #1C2B1E)' }}>

        {/* ══════════════════ HERO ══════════════════ */}
        <section style={{
          background: 'var(--color-bg, #F7F5F0)',
          paddingTop: '5rem',
          paddingBottom: '5rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Mancha de fondo verde hielo — decorativa, muy sutil */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: '-120px',
            right: '-160px',
            width: '680px',
            height: '680px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.94 0.04 150) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />
          <div aria-hidden="true" style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-120px',
            width: '420px',
            height: '420px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, oklch(0.94 0.03 150) 0%, transparent 68%)',
            pointerEvents: 'none',
          }} />

          <div style={container}>
            {/* Badge */}
            <div className="reveal" style={{ marginBottom: '2.5rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.35rem 0.875rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'rgba(61,107,80,0.08)',
                color: '#3d6b50',
                border: '1px solid rgba(61,107,80,0.18)',
              }}>
                <span style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: '#3d6b50',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }} />
                Beta 1.0 — Gratis
              </span>
            </div>

            {/* Título */}
            <h1 className="reveal" style={{
              fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              fontWeight: 700,
              fontSize: 'clamp(2.75rem, 6vw, 5.5rem)',
              lineHeight: 1.08,
              letterSpacing: '-0.02em',
              color: 'var(--color-text, #1C2B1E)',
              marginBottom: '1.5rem',
              maxWidth: '820px',
              transitionDelay: '0.08s',
            }}>
              ¿Es este producto<br />
              <em style={{ fontStyle: 'italic', color: '#3d6b50' }}>seguro</em>{' '}
              {/* FIX: opacity 0.28 → 0.55 para legibilidad */}
              <span style={{ color: 'rgba(28,43,30,0.55)' }}>para ti?</span>
            </h1>

            {/* Subtítulo */}
            {/* FIX: --color-text-muted #6B7E6F → #4a5e50 (mayor contraste sobre fondo crema) */}
            <p className="reveal" style={{
              fontSize: 'clamp(1rem, 1.5vw, 1.125rem)',
              color: 'var(--color-text-muted, #4a5e50)',
              lineHeight: 1.7,
              maxWidth: '480px',
              marginBottom: '2.5rem',
              transitionDelay: '0.14s',
            }}>
              Introduce el código de barras y nuestra IA analiza cada ingrediente al instante. Sin dudas, sin riesgos.
            </p>

            {/* Buscador */}
            <form className="reveal" onSubmit={buscarProducto} style={{ maxWidth: '620px', marginBottom: '1.25rem', transitionDelay: '0.20s' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem',
                borderRadius: '9999px',
                background: '#fff',
                border: '1.5px solid rgba(28,43,30,0.12)',
                boxShadow: '0 2px 16px rgba(28,43,30,0.07)',
              }}>
                <span style={{ paddingLeft: '0.875rem', color: 'rgba(28,43,30,0.3)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Código EAN · prueba: demo · noapto · dudoso"
                  value={ean}
                  onChange={e => setEan(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 0.5rem',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    color: 'var(--color-text, #1C2B1E)',
                  }}
                />
                {/* Botón cámara */}
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear código de barras"
                  style={{
                    padding: '0.625rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgba(28,43,30,0.35)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 180ms ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#3d6b50'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(28,43,30,0.35)'}
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
                {/* Botón verificar */}
                <button
                  type="submit"
                  disabled={loading || !ean.trim()}
                  style={{
                    padding: '0.75rem 1.375rem',
                    borderRadius: '9999px',
                    background: loading || !ean.trim() ? 'rgba(61,107,80,0.35)' : '#3d6b50',
                    color: '#fff',
                    fontFamily: 'inherit',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: 'none',
                    cursor: loading || !ean.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 180ms ease, transform 180ms ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  {loading ? (
                    <>
                      <svg style={{ animation: 'spin 0.8s linear infinite' }} width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analizando…
                    </>
                  ) : 'Verificar'}
                </button>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div style={{
                maxWidth: '620px',
                padding: '0.875rem 1rem',
                borderRadius: '0.875rem',
                background: 'rgba(139,46,46,0.06)',
                border: '1px solid rgba(139,46,46,0.15)',
                color: '#8b2e2e',
                fontSize: '0.875rem',
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
                marginBottom: '1.25rem',
              }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ marginTop: '1px', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            {/* Recientes */}
            {/* FIX: opacity 0.40 → 0.55 en label "Recientes" */}
            <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '4rem', transitionDelay: '0.26s' }}>
              <span style={{ fontSize: '0.8125rem', color: 'rgba(28,43,30,0.55)', fontWeight: 500 }}>Recientes:</span>
              {[{ label: 'Avena Quaker', ok: false }, { label: 'Maizena', ok: true }, { label: 'Pan Bimbo', ok: false }].map(s => (
                <button
                  key={s.label}
                  onClick={() => setEan(s.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.375rem 0.875rem',
                    borderRadius: '9999px',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    fontFamily: 'inherit',
                    background: '#fff',
                    border: '1px solid rgba(28,43,30,0.10)',
                    /* FIX: opacity 0.65 → 0.80 */
                    color: 'rgba(28,43,30,0.80)',
                    cursor: 'pointer',
                    transition: 'border-color 180ms ease, box-shadow 180ms ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(61,107,80,0.4)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(61,107,80,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(28,43,30,0.10)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.ok ? '#3d6b50' : '#8b2e2e', flexShrink: 0 }} />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="reveal" style={{ display: 'flex', flexWrap: 'wrap', gap: '3.5rem', transitionDelay: '0.32s' }}>
              {[
                { valor: '+50.000', label: 'productos analizados' },
                { valor: '99%',     label: 'de precisión' },
                { valor: 'Gratis',  label: 'sin suscripción' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 700, fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", color: 'var(--color-text, #1C2B1E)', lineHeight: 1.1 }}>
                    {s.valor}
                  </p>
                  {/* FIX: --color-text-muted #6B7E6F → #4a5e50 */}
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted, #4a5e50)', marginTop: '0.25rem', fontWeight: 500 }}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════ RESULTADO ══════════════════ */}
        {resultado && !loading && cfg && (
          <section ref={resultRef} style={{ background: '#F7F5F0', paddingTop: '4rem', paddingBottom: '4rem' }}>
            <div style={container}>
              {/* FIX: opacity 0.40 → 0.55 */}
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(28,43,30,0.55)', marginBottom: '1.5rem' }}>
                Resultado del análisis
              </p>
              <div style={{ maxWidth: '640px', borderRadius: '1.5rem', overflow: 'hidden', boxShadow: '0 8px 40px rgba(28,43,30,0.10)', border: '1px solid rgba(28,43,30,0.06)' }}>

                {/* Cabecera resultado */}
                <div style={{ padding: '1.75rem', background: `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <span style={{ width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                        {cfg.icon}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: cfg.text, opacity: 0.85, maxWidth: '380px', marginBottom: '0.75rem' }}>
                      {resultado.analisis?.motivo ?? 'Análisis no disponible'}
                    </p>
                    <div style={{ opacity: 0.7 }}>
                      <span style={{ fontSize: '0.75rem', color: cfg.text }}>Fuente: {fuenteTexto}</span>
                      {urlFuente && (
                        <>{' · '}
                          <a href={urlFuente} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: cfg.text, textDecoration: 'underline' }}>
                            Ver fuente original
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleFavorito}
                    style={{ flexShrink: 0, width: '2.25rem', height: '2.25rem', borderRadius: '50%', background: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', transition: 'transform 180ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {esFavorito
                      ? <svg width="16" height="16" fill="#8b2e2e" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                      : <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="rgba(28,43,30,0.35)" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                    }
                  </button>
                </div>

                {/* Cuerpo resultado */}
                <div style={{ background: '#fff' }}>
                  {resultado.producto?.imagen_url && (
                    <div style={{ width: '100%', height: '260px', position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(28,43,30,0.06)' }}>
                      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${resultado.producto.imagen_url})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.9) saturate(0.5)', transform: 'scale(1.15)', opacity: 0.35 }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(247,245,240,0.3) 0%, rgba(247,245,240,0.5) 100%)' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                        <img src={resultado.producto.imagen_url} alt={resultado.producto?.nombre ?? 'Producto'}
                          style={{ maxHeight: '200px', maxWidth: '80%', objectFit: 'contain', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.16))', position: 'relative', zIndex: 1 }}
                          onError={e => { e.currentTarget.parentElement.parentElement.style.display = 'none'; }} />
                      </div>
                    </div>
                  )}

                  <div style={{ padding: '1.75rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text, #1C2B1E)', lineHeight: 1.25, marginBottom: '0.375rem' }}>
                      {resultado.producto?.nombre ?? 'Producto sin nombre'}
                    </h2>
                    {/* FIX: opacity 0.45 → 0.60 en badge de marca */}
                    <span style={{ display: 'inline-block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(28,43,30,0.60)', background: 'rgba(28,43,30,0.05)', padding: '0.25rem 0.75rem', borderRadius: '9999px', marginBottom: '1.5rem' }}>
                      {resultado.producto?.marca ?? 'Marca desconocida'}
                    </span>

                    <div style={{ borderRadius: '0.875rem', padding: '1.125rem', background: '#F7F5F0', marginBottom: '1.25rem' }}>
                      {/* FIX: opacity 0.40 → 0.55 en label ingredientes */}
                      <p style={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(28,43,30,0.55)', marginBottom: '0.5rem' }}>Ingredientes</p>
                      {/* FIX: opacity 0.75 → 0.88 en texto ingredientes */}
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.65, color: 'rgba(28,43,30,0.88)' }}>{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                    </div>

                    {wrongCount === 0 ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderRadius: '0.75rem', background: 'rgba(28,43,30,0.03)', border: '1px solid rgba(28,43,30,0.07)', marginBottom: '1.25rem' }}>
                        {/* FIX: opacity 0.50 → 0.65 */}
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(28,43,30,0.65)' }}>¿El resultado no corresponde al producto que tienes?</p>
                        <button onClick={handleWrongProduct}
                          style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(28,43,30,0.55)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.75rem', flexShrink: 0, fontFamily: 'inherit', transition: 'color 180ms ease' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#3d6b50'}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(28,43,30,0.55)'}
                        >
                          No es mi producto
                        </button>
                      </div>
                    ) : (
                      <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(61,107,80,0.18)', background: 'linear-gradient(135deg, #f0faf4, #e6f5ec)', marginBottom: '1.25rem' }}>
                        <div style={{ padding: '1.25rem 1.375rem' }}>
                          <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.625rem', background: 'rgba(61,107,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#3d6b50" strokeWidth={1.8}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontWeight: 800, color: 'var(--color-text, #1C2B1E)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>¿Quieres un análisis más preciso?</p>
                              {/* FIX: opacity 0.60 → 0.75 */}
                              <p style={{ fontSize: '0.8125rem', color: 'rgba(28,43,30,0.75)', lineHeight: 1.55 }}>
                                Haz una foto a la etiqueta de ingredientes o al frente del envase. Nuestra IA lo identificará visualmente.
                              </p>
                            </div>
                          </div>
                          <button onClick={() => setFotoOpen(true)}
                            style={{ width: '100%', padding: '0.875rem', borderRadius: '0.75rem', background: '#3d6b50', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 16px rgba(61,107,80,0.25)', transition: 'background 180ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#2e5340'}
                            onMouseLeave={e => e.currentTarget.style.background = '#3d6b50'}
                          >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                            </svg>
                            Analizar con foto del producto
                          </button>
                        </div>
                        <div style={{ padding: '0 1.375rem 1.125rem' }}>
                          <button onClick={() => setWrongCount(0)}
                            style={{ fontSize: '0.8125rem', color: 'rgba(28,43,30,0.55)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 180ms ease' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'rgba(28,43,30,0.80)'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(28,43,30,0.55)'}
                          >
                            No, el resultado es correcto
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => { setResultado(null); setEan(''); setWrongCount(0); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(28,43,30,0.55)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'color 180ms ease' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#3d6b50'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(28,43,30,0.55)'}
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

        {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
        <section style={{ background: '#F7F5F0', paddingTop: '5rem', paddingBottom: '5rem' }} id="como-funciona">
          <div style={container}>
            <div className="reveal" style={{ marginBottom: '3.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3d6b50', marginBottom: '0.75rem' }}>Cómo funciona</p>
              <h2 style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontSize: 'clamp(2rem, 4vw, 3.25rem)', fontWeight: 700, color: 'var(--color-text, #1C2B1E)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                Tres pasos.<br />Resultado inmediato.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {[
                { num: '01', titulo: 'Introduce el código', desc: 'Escribe o escanea el código de barras de cualquier producto con tu cámara.', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" /></svg> },
                { num: '02', titulo: 'La IA lo analiza', desc: 'Nuestra IA revisa cada ingrediente, aditivo y posible traza de gluten en segundos.', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" /></svg> },
                { num: '03', titulo: 'Respuesta clara', desc: 'Recibes APTO, NO APTO o DUDOSO con explicación detallada del motivo.', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              ].map(({ num, titulo, desc, icon }) => (
                <div key={num} className="reveal" style={{ borderRadius: '1.25rem', padding: '1.75rem', background: '#fff', boxShadow: '0 1px 8px rgba(28,43,30,0.05)', border: '1px solid rgba(28,43,30,0.06)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', background: 'rgba(61,107,80,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3d6b50' }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1, color: 'rgba(28,43,30,0.06)', fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", userSelect: 'none' }}>{num}</span>
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'var(--color-text, #1C2B1E)', fontSize: '1.0625rem', marginBottom: '0.5rem' }}>{titulo}</h3>
                  {/* FIX: --color-text-muted #6B7E6F → #4a5e50 */}
                  <p style={{ color: 'var(--color-text-muted, #4a5e50)', fontSize: '0.875rem', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════ REVIEWS ══════════════════ */}
        <SectionReviews />

        {/* ══════════════════ SOBRE CELIAPP ══════════════════ */}
        <section style={{ background: '#F7F5F0', paddingTop: '5rem', paddingBottom: '5rem' }} id="sobre-celiapp">
          <div style={container}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem', alignItems: 'start' }}>
              <div className="reveal">
                <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3d6b50', marginBottom: '0.75rem' }}>Contacto</p>
                <h2 style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 700, color: 'var(--color-text, #1C2B1E)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.5rem' }}>
                  ¿Tienes alguna<br />pregunta?
                </h2>
                {/* FIX: --color-text-muted #6B7E6F → #4a5e50 */}
                <p style={{ color: 'var(--color-text-muted, #4a5e50)', fontSize: '0.9375rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                  Estamos aquí para ayudarte. Si tienes dudas sobre un producto, quieres reportar un error o simplemente quieres saber más, escríbenos.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { icon: '✉', label: 'Email', val: 'hola@celiapp.es' },
                    { icon: '📍', label: 'Ubicación', val: 'Madrid, España' },
                    { icon: '⚡', label: 'Respuesta en', val: 'menos de 24 horas' },
                  ].map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem', background: '#fff', boxShadow: '0 1px 4px rgba(28,43,30,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                        {c.icon}
                      </div>
                      <div>
                        {/* FIX: --color-text-muted #6B7E6F → #4a5e50 */}
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted, #4a5e50)', fontWeight: 500 }}>{c.label}</p>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text, #1C2B1E)' }}>{c.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reveal" style={{ borderRadius: '1.5rem', padding: '2rem', background: '#fff', boxShadow: '0 4px 24px rgba(28,43,30,0.07)', border: '1px solid rgba(28,43,30,0.06)' }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} onSubmit={e => { e.preventDefault(); showToast('✓ Mensaje enviado. Te respondemos pronto.'); e.target.reset(); }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {[{ label: 'Nombre', type: 'text', ph: 'Tu nombre' }, { label: 'Email', type: 'email', ph: 'tu@email.com' }].map(f => (
                      <div key={f.label}>
                        {/* FIX: form label opacity 0.50 → 0.65 */}
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(28,43,30,0.65)', display: 'block', marginBottom: '0.375rem' }}>{f.label}</label>
                        <input type={f.type} placeholder={f.ph} required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: '#F7F5F0', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--color-text, #1C2B1E)', outline: 'none' }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(28,43,30,0.65)', display: 'block', marginBottom: '0.375rem' }}>Asunto</label>
                    <select style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: '#F7F5F0', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--color-text, #1C2B1E)', outline: 'none', appearance: 'none' }}>
                      <option>Duda sobre un producto</option>
                      <option>Reportar un error</option>
                      <option>Sugerencia de mejora</option>
                      <option>Colaboración</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(28,43,30,0.65)', display: 'block', marginBottom: '0.375rem' }}>Mensaje</label>
                    <textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: 'none', background: '#F7F5F0', fontSize: '0.875rem', fontFamily: 'inherit', color: 'var(--color-text, #1C2B1E)', outline: 'none', resize: 'none' }} />
                  </div>
                  <button type="submit" style={{ padding: '0.875rem', borderRadius: '0.75rem', background: '#3d6b50', color: '#fff', fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'background 180ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#2e5340'}
                    onMouseLeave={e => e.currentTarget.style.background = '#3d6b50'}
                  >
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════ FOOTER ══════════════════ */}
        <footer style={{ background: '#1C2B1E', paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div style={container}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', paddingBottom: '2.5rem', marginBottom: '2.5rem', borderBottom: '1px solid rgba(247,245,240,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect width="32" height="32" rx="9" fill="#4a7c59" />
                  <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                  <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                  <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                  <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                  <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                  <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
                </svg>
                <span style={{ fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)", fontWeight: 700, color: '#F7F5F0', fontSize: '1.125rem' }}>CeliApp</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'rgba(247,245,240,0.35)', textAlign: 'center' }}>Tu asistente personal para una dieta sin gluten segura</p>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {['Privacidad', 'Términos'].map(l => (
                  <a key={l} href="#" style={{ fontSize: '0.8125rem', color: 'rgba(247,245,240,0.3)', textDecoration: 'none', transition: 'color 180ms ease' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(247,245,240,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(247,245,240,0.3)'}
                  >{l}</a>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', textAlign: 'center', color: 'rgba(247,245,240,0.2)' }}>© 2026 CeliApp · Hecho con ♥ para la comunidad celíaca</p>
          </div>
        </footer>

        {/* ══════════════════ TOAST ══════════════════ */}
        {toastMsg && (
          <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 50 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', background: '#1C2B1E', color: '#F7F5F0', fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(28,43,30,0.25)' }}>
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} style={{ color: 'rgba(247,245,240,0.4)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }
        `}</style>
      </div>
    </>
  );
}
