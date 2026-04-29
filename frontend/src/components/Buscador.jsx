import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* ─── Demo data ─────────────────────────────────────────────────────────── */
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

const REVIEWS = [
  { nombre: 'María G.', ciudad: 'Madrid', texto: 'Desde que uso CeliApp hago la compra sin estrés. Antes tardaba el doble leyendo etiquetas con lupa.', estrellas: 5, tiempo: 'hace 2 días' },
  { nombre: 'Carlos R.', ciudad: 'Barcelona', texto: 'Por fin una app que entiende que "puede contener trazas" no es lo mismo que "sin gluten". Muy precisa.', estrellas: 5, tiempo: 'hace 1 semana' },
  { nombre: 'Ana P.', ciudad: 'Sevilla', texto: 'Mi hija tiene celiaquía y esta app nos ha cambiado la vida. Escaneamos todo antes de comprar.', estrellas: 5, tiempo: 'hace 2 semanas' },
  { nombre: 'David M.', ciudad: 'Valencia', texto: 'Interfaz clarísima. El código de colores APTO/NO APTO se ve de un vistazo aunque tengas prisa.', estrellas: 4, tiempo: 'hace 3 semanas' },
  { nombre: 'Laura S.', ciudad: 'Bilbao', texto: 'Llevo años buscando algo así. La base de datos es enorme, casi todos los productos que escaneo están.', estrellas: 5, tiempo: 'hace 1 mes' },
  { nombre: 'Javier T.', ciudad: 'Zaragoza', texto: 'El análisis de ingredientes ambiguos es lo que me convenció. No te da un sí/no sin más, te explica por qué.', estrellas: 5, tiempo: 'hace 1 mes' },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function getStatusConfig(analisis) {
  if (!analisis) return null;
  if (analisis.es_apto === null || analisis.es_apto === undefined)
    return { label: 'DUDOSO', bg: '#f59e0b', gradStart: '#fffbeb', gradEnd: '#fef3c7', text: '#92400e', icon: '?' };
  return analisis.es_apto
    ? { label: 'APTO', bg: '#10b981', gradStart: '#ecfdf5', gradEnd: '#d1fae5', text: '#065f46', icon: '✓' }
    : { label: 'NO APTO', bg: '#ef4444', gradStart: '#fff1f2', gradEnd: '#fecdd3', text: '#9f1239', icon: '✕' };
}

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= n ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function Buscador() {
  const { token } = useAuth();
  const [ean, setEan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [demoMode, setDemoMode] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const resultRef = useRef(null);

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const buscarProducto = async (e) => {
    e?.preventDefault();
    if (!ean.trim()) return;
    setLoading(true); setError(null); setResultado(null); setEsFavorito(false);
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
      else if (err.response?.status === 404) setError('Producto no encontrado. Prueba con: demo · noapto · dudoso');
      else if (err.response?.status === 429) setError('Límite alcanzado. Espera un momento.');
      else                                   setError('Sin conexión al servidor. Prueba: demo · noapto · dudoso');
    } finally { setLoading(false); }
  };

  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token)      { showToast('Inicia sesión para guardar favoritos'); return; }
    if (esFavorito)  { showToast('Ya está en tus favoritos'); return; }
    if (demoMode)    { setEsFavorito(true); showToast('Añadido a favoritos'); return; }
    try {
      await axios.post(`${API_URL}/favoritos`, { ean }, { headers: { Authorization: `Bearer ${token}` } });
      setEsFavorito(true); showToast('Añadido a favoritos');
    } catch { showToast('No se pudo guardar el favorito'); }
  };

  const cfg = getStatusConfig(resultado?.analisis);

  return (
    <>
      {scannerOpen && (
        <Scanner
          onScanSuccess={(code) => { setEan(code); setScannerOpen(false); setTimeout(() => buscarProducto(), 100); }}
          onClose={() => setScannerOpen(false)}
        />
      )}

      <div className="w-full" style={{ fontFamily: "'Satoshi', system-ui, sans-serif" }}>

        {/* ══════════════════════════════════════════════════
            HERO — oscuro, profundo, premium
        ══════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #070d0a 0%, #0b1812 50%, #0e1e15 100%)',
            minHeight: '90vh',
          }}
        >
          {/* Malla de puntos */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
          {/* Glow derecha */}
          <div className="absolute pointer-events-none" style={{
            top: '-150px', right: '-100px', width: '800px', height: '800px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.13) 0%, transparent 60%)',
          }} />
          {/* Glow izquierda baja */}
          <div className="absolute pointer-events-none" style={{
            bottom: '-80px', left: '-80px', width: '500px', height: '500px',
            background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }} />

          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-20 pb-32">

            {/* Badge */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-10"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Beta 1.0 — Gratis
            </span>

            {/* Titular */}
            <h1
              className="font-black tracking-tight leading-none mb-6"
              style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', color: '#f0fdf4' }}
            >
              ¿Es este producto<br />
              <span style={{ color: '#34d399' }}>seguro</span>{' '}
              <span style={{ color: 'rgba(240,253,244,0.35)' }}>para ti?</span>
            </h1>

            <p className="text-lg mb-12 max-w-xl leading-relaxed" style={{ color: 'rgba(240,253,244,0.5)' }}>
              Introduce el código de barras y nuestra IA analiza cada ingrediente
              al instante. Sin dudas, sin riesgos.
            </p>

            {/* ── Buscador ── */}
            <form onSubmit={buscarProducto} className="w-full max-w-2xl mb-6">
              <div
                className="flex items-center gap-1 p-1.5 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(240,253,244,0.25)' }}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Código EAN · prueba: demo · noapto · dudoso"
                    value={ean}
                    onChange={e => setEan(e.target.value)}
                    className="w-full py-4 pl-12 pr-4 bg-transparent text-sm font-medium focus:outline-none"
                    style={{ color: '#f0fdf4' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  className="p-3.5 rounded-xl transition-all"
                  style={{ color: 'rgba(240,253,244,0.3)' }}
                  title="Escanear con cámara"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={loading || !ean.trim()}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: '#10b981', color: '#fff' }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Analizando…
                    </>
                  ) : 'Verificar'}
                </button>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div className="max-w-2xl px-4 py-3 rounded-xl flex items-start gap-2.5 text-sm mb-6"
                style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {error}
              </div>
            )}

            {/* Chips recientes */}
            <div className="flex flex-wrap items-center gap-2 mb-16">
              <span className="text-xs font-medium" style={{ color: 'rgba(240,253,244,0.25)' }}>Recientes:</span>
              {[
                { label: 'Avena Quaker', ok: false },
                { label: 'Maizena', ok: true },
                { label: 'Pan Bimbo', ok: false },
              ].map(s => (
                <button key={s.label} onClick={() => setEan(s.label)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(240,253,244,0.45)' }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${s.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {s.label}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-12">
              {[
                { valor: '+50.000', label: 'productos analizados' },
                { valor: '99%', label: 'de precisión' },
                { valor: 'Gratis', label: 'sin suscripción' },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl font-black" style={{ color: '#f0fdf4' }}>{s.valor}</p>
                  <p className="text-xs font-medium mt-1" style={{ color: 'rgba(240,253,244,0.35)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transición suave al fondo claro */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, #f4f3f0)' }} />
        </section>

        {/* ══════════════════════════════════════════════════
            RESULTADO
        ══════════════════════════════════════════════════ */}
        {resultado && !loading && cfg && (
          <section ref={resultRef} style={{ background: '#f4f3f0' }} className="py-16">
            <div className="max-w-5xl mx-auto px-5 sm:px-8">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">Resultado del análisis</p>
              <div className="max-w-2xl rounded-3xl overflow-hidden"
                style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.10)', border: '1px solid rgba(0,0,0,0.05)' }}>

                {/* Header */}
                <div
                  className="px-7 py-6 flex items-start justify-between gap-4"
                  style={{ background: `linear-gradient(135deg, ${cfg.gradStart}, ${cfg.gradEnd})` }}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm"
                        style={{ background: cfg.bg }}>
                        {cfg.icon}
                      </span>
                      <span className="text-base font-black uppercase tracking-widest" style={{ color: cfg.text }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed max-w-md" style={{ color: cfg.text, opacity: 0.85 }}>
                      {resultado.analisis?.motivo ?? 'Análisis no disponible'}
                    </p>
                  </div>
                  <button onClick={toggleFavorito}
                    className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center transition-all hover:scale-110"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    {esFavorito
                      ? <svg className="w-4 h-4" fill="#ef4444" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                      : <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
                    }
                  </button>
                </div>

                {/* Body */}
                <div className="bg-white px-7 py-7">
                  <h2 className="text-xl font-black text-gray-900 leading-tight mb-1">
                    {resultado.producto?.nombre ?? 'Producto sin nombre'}
                  </h2>
                  <span className="inline-block text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full mb-6">
                    {resultado.producto?.marca ?? 'Marca desconocida'}
                  </span>
                  <div className="rounded-2xl p-5 mb-5" style={{ background: '#f4f3f0' }}>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ingredientes</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <button onClick={() => { setResultado(null); setEan(''); }}
                      className="text-xs font-medium text-gray-400 hover:text-emerald-600 flex items-center gap-1.5 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
                      </svg>
                      Nueva búsqueda
                    </button>
                    <span className="text-xs text-gray-300">Fuente: {resultado.fuente ?? 'Desconocida'}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════════
            CÓMO FUNCIONA
        ══════════════════════════════════════════════════ */}
        <section style={{ background: '#f4f3f0' }} className="py-24">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Cómo funciona</p>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
                Tres pasos.<br />Resultado inmediato.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  num: '01', titulo: 'Introduce el código',
                  desc: 'Escribe o escanea el código de barras de cualquier producto con tu cámara.',
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75z"/></svg>,
                },
                {
                  num: '02', titulo: 'La IA lo analiza',
                  desc: 'Nuestra IA revisa cada ingrediente, aditivo y posible traza de gluten en segundos.',
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3"/></svg>,
                },
                {
                  num: '03', titulo: 'Respuesta clara',
                  desc: 'Recibes APTO, NO APTO o DUDOSO con explicación detallada del motivo.',
                  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                },
              ].map(({ num, titulo, desc, icon }) => (
                <div key={num}
                  className="rounded-2xl p-7"
                  style={{ background: '#fff', boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                      style={{ background: '#ecfdf5', color: '#10b981' }}>
                      {icon}
                    </div>
                    <span className="text-5xl font-black leading-none select-none" style={{ color: '#f0efec' }}>
                      {num}
                    </span>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mb-2">{titulo}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Demo card dark */}
            <div className="mt-10 rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2"
              style={{ background: 'linear-gradient(135deg, #070d0a, #0e1e15)', boxShadow: '0 12px 48px rgba(0,0,0,0.18)' }}>
              <div className="p-10 sm:p-12">
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#34d399' }}>Ejemplo real</p>
                <h3 className="text-2xl font-black mb-4 leading-tight" style={{ color: '#f0fdf4' }}>
                  Así se ve una<br />respuesta de CeliApp
                </h3>
                <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(240,253,244,0.45)' }}>
                  Cada análisis muestra el veredicto, el motivo exacto y los ingredientes. Sin ambigüedades.
                </p>
                <button
                  onClick={() => { setEan('demo'); setTimeout(() => buscarProducto({ preventDefault: () => {} }), 50); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: '#10b981', color: '#fff' }}>
                  Probar con un ejemplo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                  </svg>
                </button>
              </div>
              <div className="p-8 sm:p-10 flex items-center">
                <div className="w-full rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
                  <div style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }} className="px-5 py-4">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-black flex items-center justify-center">✓</span>
                      <span className="text-sm font-black text-emerald-700 uppercase tracking-widest">APTO</span>
                    </div>
                    <p className="text-xs text-emerald-700 opacity-80">No contiene gluten ni trazas declaradas en etiqueta.</p>
                  </div>
                  <div className="bg-white p-5">
                    <p className="font-black text-gray-900 text-sm mb-1">Queso Crema Light Hacendado</p>
                    <span className="inline-block text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mb-3">Hacendado</span>
                    <div className="rounded-xl p-3.5" style={{ background: '#f4f3f0' }}>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ingredientes</p>
                      <p className="text-xs text-gray-500 leading-relaxed">Leche pasteurizada, nata, proteínas de leche, sal…</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            REVIEWS
        ══════════════════════════════════════════════════ */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Opiniones</p>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
                  Lo que dicen<br />nuestros usuarios
                </h2>
              </div>
              <div className="flex items-center gap-4 px-5 py-4 rounded-2xl w-fit shrink-0" style={{ background: '#f4f3f0' }}>
                <div>
                  <p className="text-3xl font-black text-gray-900 leading-none">4.9</p>
                  <Stars n={5} />
                </div>
                <div className="pl-4" style={{ borderLeft: '1px solid #e0ddd8' }}>
                  <p className="text-xs text-gray-500 font-medium">Valoración media</p>
                  <p className="text-xs text-gray-400">+1.200 reseñas</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {REVIEWS.map((r, i) => (
                <div key={i} className="rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: '#f4f3f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0"
                        style={{ background: '#d1fae5', color: '#065f46' }}>
                        {r.nombre.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{r.nombre}</p>
                        <p className="text-xs text-gray-400">{r.ciudad}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 shrink-0 mt-0.5">{r.tiempo}</span>
                  </div>
                  <Stars n={r.estrellas} />
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">"{r.texto}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            CONTACTO
        ══════════════════════════════════════════════════ */}
        <section style={{ background: '#f4f3f0' }} className="py-24">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3">Contacto</p>
                <h2 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight mb-6">
                  ¿Tienes alguna<br />pregunta?
                </h2>
                <p className="text-gray-500 text-base leading-relaxed mb-10">
                  Estamos aquí para ayudarte. Si tienes dudas sobre un producto,
                  quieres reportar un error o simplemente quieres saber más, escríbenos.
                </p>
                <div className="space-y-4">
                  {[
                    { icon: '✉', label: 'Email', val: 'hola@celiapp.es' },
                    { icon: '📍', label: 'Ubicación', val: 'Madrid, España' },
                    { icon: '⚡', label: 'Respuesta en', val: 'menos de 24 horas' },
                  ].map(c => (
                    <div key={c.label} className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                        style={{ background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                        {c.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                        <p className="text-sm font-semibold text-gray-800">{c.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl p-8" style={{ background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <form className="space-y-4"
                  onSubmit={e => { e.preventDefault(); showToast('✓ Mensaje enviado. Te respondemos pronto.'); e.target.reset(); }}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Nombre', type: 'text', ph: 'Tu nombre' },
                      { label: 'Email', type: 'email', ph: 'tu@email.com' },
                    ].map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-semibold text-gray-400 block mb-1.5">{f.label}</label>
                        <input type={f.type} placeholder={f.ph} required
                          className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 font-medium focus:outline-none"
                          style={{ background: '#f4f3f0', border: 'none' }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Asunto</label>
                    <select className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 font-medium focus:outline-none appearance-none"
                      style={{ background: '#f4f3f0', border: 'none' }}>
                      <option>Duda sobre un producto</option>
                      <option>Reportar un error</option>
                      <option>Sugerencia de mejora</option>
                      <option>Colaboración</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">Mensaje</label>
                    <textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required
                      className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 placeholder-gray-400 font-medium focus:outline-none resize-none"
                      style={{ background: '#f4f3f0', border: 'none' }} />
                  </div>
                  <button type="submit"
                    className="w-full py-4 rounded-xl font-semibold text-sm text-white transition-all"
                    style={{ background: '#10b981' }}>
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════ */}
        <footer style={{ background: 'linear-gradient(135deg, #070d0a 0%, #0e1e15 100%)' }} className="py-16">
          <div className="max-w-5xl mx-auto px-5 sm:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-10 mb-10"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                  style={{ background: '#10b981' }}>C</span>
                <span className="font-black text-white text-lg">CeliApp</span>
              </div>
              <p className="text-sm text-center" style={{ color: 'rgba(240,253,244,0.3)' }}>
                Tu asistente personal para una dieta sin gluten segura
              </p>
              <div className="flex gap-6 text-xs" style={{ color: 'rgba(240,253,244,0.25)' }}>
                <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                <a href="#" className="hover:text-white transition-colors">Términos</a>
              </div>
            </div>
            <p className="text-xs text-center" style={{ color: 'rgba(240,253,244,0.2)' }}>
              © 2026 CeliApp · Hecho con ♥ para la comunidad celíaca
            </p>
          </div>
        </footer>

        {/* ══════════════════════════════════════════════════
            TOAST
        ══════════════════════════════════════════════════ */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-white text-sm font-medium"
              style={{ background: '#111827', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} className="transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}