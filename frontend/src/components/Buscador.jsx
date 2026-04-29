import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* ─── Demo data ─────────────────────────────────────────── */
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

const RECENT_SEARCHES = [
  { label: 'Avena Quaker', estado: false },
  { label: 'Maizena', estado: true },
  { label: 'Pan Bimbo', estado: false },
];

const REVIEWS = [
  { nombre: 'María G.', ciudad: 'Madrid', texto: 'Desde que uso CeliApp hago la compra sin estrés. Antes tardaba el doble leyendo etiquetas con lupa.', estrellas: 5, tiempo: 'hace 2 días' },
  { nombre: 'Carlos R.', ciudad: 'Barcelona', texto: 'Por fin una app que entiende que "puede contener trazas" no es lo mismo que "sin gluten". Muy precisa.', estrellas: 5, tiempo: 'hace 1 semana' },
  { nombre: 'Ana P.', ciudad: 'Sevilla', texto: 'Mi hija tiene celiaquía y esta app nos ha cambiado la vida. Escaneamos todo antes de comprar.', estrellas: 5, tiempo: 'hace 2 semanas' },
  { nombre: 'David M.', ciudad: 'Valencia', texto: 'Interfaz clarísima. El código de colores APTO/NO APTO se ve de un vistazo aunque tengas prisa.', estrellas: 4, tiempo: 'hace 3 semanas' },
  { nombre: 'Laura S.', ciudad: 'Bilbao', texto: 'Llevo años buscando algo así. La base de datos es enorme, casi todos los productos que escaneo están.', estrellas: 5, tiempo: 'hace 1 mes' },
  { nombre: 'Javier T.', ciudad: 'Zaragoza', texto: 'El análisis de ingredientes ambiguos es lo que me convenció. No te da un sí/no sin más, te explica por qué.', estrellas: 5, tiempo: 'hace 1 mes' },
];

/* ─── Helpers ────────────────────────────────────────────── */
function getStatusConfig(analisis) {
  if (!analisis) return { label: 'DESCONOCIDO', badge: 'bg-gray-100 text-gray-600 border-gray-200', headerBg: 'bg-gray-50', headerBorder: 'border-gray-100', cardBorder: 'border-gray-200', textColor: 'text-gray-600', dotColor: 'bg-gray-400', icon: '?' };
  if (analisis.es_apto === null) return { label: 'DUDOSO', badge: 'bg-amber-50 text-amber-700 border-amber-200', headerBg: 'bg-amber-50', headerBorder: 'border-amber-100', cardBorder: 'border-amber-200', textColor: 'text-amber-700', dotColor: 'bg-amber-400', icon: '!' };
  return analisis.es_apto
    ? { label: 'APTO', badge: 'bg-brand-50 text-brand-700 border-brand-200', headerBg: 'bg-brand-50', headerBorder: 'border-brand-100', cardBorder: 'border-brand-200', textColor: 'text-brand-700', dotColor: 'bg-brand-500', icon: '✓' }
    : { label: 'NO APTO', badge: 'bg-red-50 text-red-700 border-red-200', headerBg: 'bg-red-50', headerBorder: 'border-red-100', cardBorder: 'border-red-200', textColor: 'text-red-700', dotColor: 'bg-red-500', icon: '✕' };
}

function Stars({ n }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-4 h-4 ${i <= n ? 'text-amber-400' : 'text-gray-200'}`}
             fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}

/* ─── Componente principal ───────────────────────────────── */
export default function Buscador() {
  const { token } = useAuth();
  const [ean, setEan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [demoMode, setDemoMode] = useState(false);
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
      else if (err.response?.status === 404) setError('Producto no encontrado. Prueba: demo · noapto · dudoso');
      else if (err.response?.status === 429) setError('Límite alcanzado. Espera un momento.');
      else                                   setError('Sin conexión. Prueba: demo · noapto · dudoso');
    } finally { setLoading(false); }
  };

  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token) { showToast('Inicia sesión para guardar favoritos'); return; }
    if (esFavorito) { showToast('Ya está en tus favoritos'); return; }
    if (demoMode)   { setEsFavorito(true); showToast('Añadido a favoritos'); return; }
    try {
      await axios.post(`${API_URL}/favoritos`, { ean }, { headers: { Authorization: `Bearer ${token}` } });
      setEsFavorito(true); showToast('Añadido a favoritos');
    } catch { showToast('No se pudo guardar el favorito'); }
  };

  const cfg = getStatusConfig(resultado?.analisis);

  return (
    <div className="w-full">

      {/* ══════════════════════════════════════════════════
          SECCIÓN 1 — HERO + BUSCADOR
      ══════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-white">
        {/* Blob decorativo de fondo */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full
                        bg-brand-50 opacity-60 blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-16 -left-16 w-[300px] h-[300px] rounded-full
                        bg-blue-50 opacity-40 blur-2xl pointer-events-none"/>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                             bg-brand-50 text-brand-600 text-xs font-semibold tracking-widest
                             uppercase border border-brand-100 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse"/>
              Beta 1.0 — Gratis
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight
                           leading-[1.05] mb-5">
              ¿Este producto<br/>
              es <span className="text-brand-500">seguro</span> para ti?
            </h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-lg">
              Introduce el código de barras y nuestra IA analiza los ingredientes
              al instante. Sin dudas, sin riesgos.
            </p>

            {/* Barra de búsqueda */}
            <form onSubmit={buscarProducto}>
              <div className="flex gap-2 bg-white rounded-2xl p-2 border border-gray-200
                              shadow-[0_2px_12px_rgba(0,0,0,0.07)] focus-within:border-brand-300
                              focus-within:shadow-[0_2px_20px_rgba(1,162,105,0.13)]
                              transition-all duration-200 max-w-xl">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Código EAN · prueba: demo · noapto"
                    value={ean}
                    onChange={e => setEan(e.target.value)}
                    className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-transparent text-gray-900
                               placeholder-gray-400 text-sm font-medium focus:outline-none"
                  />
                </div>
                <button type="button" title="Cámara"
                  className="p-3.5 text-gray-400 hover:text-brand-500 hover:bg-brand-50 rounded-xl transition-all">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
                <button type="submit" disabled={loading || !ean.trim()}
                  className="btn-primary px-6 py-3 text-sm flex items-center gap-2 whitespace-nowrap">
                  {loading
                    ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Analizando…</>
                    : 'Verificar'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-3 max-w-xl px-4 py-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                {error}
              </div>
            )}

            {/* Chips recientes */}
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="text-xs text-gray-400 font-semibold self-center">Recientes:</span>
              {RECENT_SEARCHES.map(s => (
                <button key={s.label} onClick={() => { setEan(s.label); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white
                             border border-gray-200 text-xs text-gray-600 font-medium
                             hover:border-brand-300 hover:text-brand-600 transition-all shadow-sm">
                  <span className={`w-1.5 h-1.5 rounded-full ${s.estado ? 'bg-brand-400' : 'bg-red-400'}`}/>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats flotantes */}
          <div className="mt-12 flex flex-wrap gap-6 max-w-xl">
            {[
              { valor: '+50.000', label: 'productos analizados' },
              { valor: '99%', label: 'de precisión' },
              { valor: 'Gratis', label: 'sin suscripción' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-black text-gray-900">{s.valor}</p>
                <p className="text-xs text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECCIÓN 2 — RESULTADO (aparece al buscar)
      ══════════════════════════════════════════════════ */}
      {resultado && !loading && (
        <section ref={resultRef} className="bg-cream-100 border-y border-cream-200 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              Resultado del análisis
            </p>
            <div className={`bg-white rounded-2xl border-2 ${cfg.cardBorder} overflow-hidden
                             shadow-[0_4px_24px_rgba(0,0,0,0.07)] max-w-2xl animate-fade-in-up`}>
              {/* Header estado */}
              <div className={`${cfg.headerBg} ${cfg.headerBorder} border-b px-6 py-5
                               flex items-start justify-between gap-4`}>
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className={`w-7 h-7 rounded-full ${
                        cfg.label === 'APTO' ? 'bg-brand-500' :
                        cfg.label === 'NO APTO' ? 'bg-red-500' : 'bg-amber-500'
                      } text-white text-xs font-black flex items-center justify-center`}>
                      {cfg.icon}
                    </span>
                    <span className={`text-sm font-black uppercase tracking-widest ${cfg.textColor}`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${cfg.textColor} opacity-90 max-w-md`}>
                    {resultado.analisis?.motivo ?? 'Análisis no disponible'}
                  </p>
                </div>
                <button onClick={toggleFavorito}
                  className="shrink-0 w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100
                             flex items-center justify-center hover:scale-110 transition-all">
                  {esFavorito
                    ? <svg className="w-4 h-4 fill-red-500" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/></svg>
                    : <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/></svg>
                  }
                </button>
              </div>
              {/* Cuerpo */}
              <div className="p-6 sm:p-8">
                <h2 className="text-xl font-black text-gray-900 leading-tight mb-1">
                  {resultado.producto?.nombre ?? 'Producto sin nombre'}
                </h2>
                <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full mb-6">
                  {resultado.producto?.marca ?? 'Marca desconocida'}
                </span>
                <div className="bg-cream-100 rounded-xl p-5 border border-cream-200 mb-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ingredientes</p>
                  <p className="text-gray-700 text-sm leading-relaxed">{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={() => { setResultado(null); setEan(''); }}
                    className="text-xs text-gray-400 hover:text-brand-500 font-medium flex items-center gap-1.5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
                    Nueva búsqueda
                  </button>
                  <span className="text-xs text-gray-400">Fuente: {resultado.fuente ?? 'Desconocida'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          SECCIÓN 3 — CÓMO FUNCIONA
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl mb-12">
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Cómo funciona</p>
            <h2 className="text-3xl font-black text-gray-900 leading-tight">
              Tres pasos. Resultado inmediato.
            </h2>
          </div>

          {/* Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                titulo: 'Introduce el código',
                desc: 'Escribe o escanea el código de barras de cualquier producto alimentario con tu cámara.',
                color: 'brand',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 17.25h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"/>
                  </svg>
                ),
              },
              {
                num: '02',
                titulo: 'La IA lo analiza',
                desc: 'Nuestra inteligencia artificial revisa cada ingrediente, aditivo y posible traza de gluten.',
                color: 'blue',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
                  </svg>
                ),
              },
              {
                num: '03',
                titulo: 'Respuesta clara',
                desc: 'Recibes un resultado APTO, NO APTO o DUDOSO con explicación detallada del motivo.',
                color: 'green',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                ),
              },
            ].map(({ num, titulo, desc, color, icon }) => (
              <div key={num} className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5
                  ${color === 'brand' ? 'bg-brand-50 text-brand-600' :
                    color === 'blue'  ? 'bg-blue-50 text-blue-600'   :
                                        'bg-green-50 text-green-600'}`}>
                  {icon}
                </div>
                <span className="absolute top-0 right-0 text-5xl font-black text-gray-100 leading-none select-none">
                  {num}
                </span>
                <h3 className="font-black text-gray-900 text-lg mb-2">{titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Demo interactiva de resultado */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 items-center
                          bg-cream-100 rounded-3xl border border-cream-200 p-8 sm:p-10">
            <div>
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-3">
                Ejemplo real
              </p>
              <h3 className="text-2xl font-black text-gray-900 mb-3">
                Así se ve una respuesta de CeliApp
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Cada análisis te muestra el veredicto, el motivo exacto y los ingredientes
                completos del producto. Sin ambigüedades.
              </p>
              <button
                onClick={() => { setEan('demo'); setTimeout(() => buscarProducto({ preventDefault: () => {} }), 50); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn-primary text-sm px-6 py-3 inline-flex items-center gap-2"
              >
                Probar con un ejemplo
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                </svg>
              </button>
            </div>

            {/* Mock de tarjeta de resultado */}
            <div className="bg-white rounded-2xl border-2 border-brand-200 overflow-hidden shadow-lg">
              <div className="bg-brand-50 border-b border-brand-100 px-5 py-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-black flex items-center justify-center">✓</span>
                  <span className="text-sm font-black text-brand-700 uppercase tracking-widest">APTO</span>
                </div>
                <p className="text-sm text-brand-700 opacity-90">No contiene gluten ni trazas declaradas en etiqueta.</p>
              </div>
              <div className="p-5">
                <p className="font-black text-gray-900 text-base mb-1">Queso Crema Light Hacendado</p>
                <span className="inline-block text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-4">Hacendado</span>
                <div className="bg-cream-100 rounded-xl p-4 border border-cream-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Ingredientes</p>
                  <p className="text-xs text-gray-600 leading-relaxed">Leche pasteurizada, nata, proteínas de leche, sal, corrector de acidez (ácido cítrico)…</p>
                </div>
                <p className="mt-3 text-right text-xs text-gray-400">Fuente: OpenFoodFacts</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECCIÓN 4 — REVIEWS
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-cream-100 border-y border-cream-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Opiniones</p>
              <h2 className="text-3xl font-black text-gray-900 leading-tight">
                Lo que dicen<br/>nuestros usuarios
              </h2>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-5 py-3 shadow-sm w-fit">
              <div>
                <p className="text-2xl font-black text-gray-900 leading-none">4.9</p>
                <Stars n={5} />
              </div>
              <div className="pl-3 border-l border-gray-100">
                <p className="text-xs text-gray-500 font-medium">Valoración media</p>
                <p className="text-xs text-gray-400">+1.200 reseñas</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100
                                      shadow-sm hover:shadow-md hover:-translate-y-0.5
                                      transition-all duration-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-100 flex items-center justify-center
                                    text-brand-700 font-black text-sm shrink-0">
                      {r.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{r.nombre}</p>
                      <p className="text-xs text-gray-400">{r.ciudad}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{r.tiempo}</span>
                </div>
                <Stars n={r.estrellas} />
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">"{r.texto}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECCIÓN 5 — CONTACTO
      ══════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

            {/* Info */}
            <div>
              <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Contacto</p>
              <h2 className="text-3xl font-black text-gray-900 leading-tight mb-4">
                ¿Tienes alguna<br/>pregunta?
              </h2>
              <p className="text-gray-500 text-base leading-relaxed mb-8">
                Estamos aquí para ayudarte. Si tienes dudas sobre un producto,
                quieres reportar un error o simplemente quieres saber más sobre
                cómo funciona CeliApp, escríbenos.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '✉', label: 'Email', val: 'hola@celiapp.es' },
                  { icon: '📍', label: 'Ubicación', val: 'Madrid, España' },
                  { icon: '⚡', label: 'Respuesta en', val: 'menos de 24 horas' },
                ].map(c => (
                  <div key={c.label} className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-cream-100 border border-cream-200
                                     flex items-center justify-center text-base">
                      {c.icon}
                    </span>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">{c.label}</p>
                      <p className="text-sm font-semibold text-gray-800">{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario */}
            <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6 sm:p-8">
              <form className="space-y-4" onSubmit={e => { e.preventDefault(); showToast('¡Mensaje enviado! Te respondemos pronto.'); e.target.reset(); }}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Nombre</label>
                    <input type="text" placeholder="Tu nombre" required
                      className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white
                                 text-sm text-gray-900 placeholder-gray-400 font-medium
                                 focus:outline-none focus:border-brand-400
                                 focus:shadow-[0_0_0_3px_rgba(1,162,105,0.10)]
                                 transition-all"/>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1.5">Email</label>
                    <input type="email" placeholder="tu@email.com" required
                      className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white
                                 text-sm text-gray-900 placeholder-gray-400 font-medium
                                 focus:outline-none focus:border-brand-400
                                 focus:shadow-[0_0_0_3px_rgba(1,162,105,0.10)]
                                 transition-all"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Asunto</label>
                  <select className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white
                                     text-sm text-gray-900 font-medium
                                     focus:outline-none focus:border-brand-400
                                     focus:shadow-[0_0_0_3px_rgba(1,162,105,0.10)]
                                     transition-all appearance-none">
                    <option>Duda sobre un producto</option>
                    <option>Reportar un error</option>
                    <option>Sugerencia de mejora</option>
                    <option>Colaboración</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1.5">Mensaje</label>
                  <textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required
                    className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-white
                               text-sm text-gray-900 placeholder-gray-400 font-medium
                               focus:outline-none focus:border-brand-400
                               focus:shadow-[0_0_0_3px_rgba(1,162,105,0.10)]
                               transition-all resize-none"/>
                </div>
                <button type="submit" className="btn-primary w-full py-3.5 text-sm font-semibold">
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
      <footer className="bg-gray-900 text-white py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row
                        items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center
                             text-white text-sm font-black">C</span>
            <span className="font-black text-white">CeliApp</span>
          </div>
          <p className="text-xs text-gray-500 text-center">
            © 2026 CeliApp · Hecho con ❤️ para la comunidad celíaca
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Términos</a>
          </div>
        </div>
      </footer>

      {/* ── Toast ─────────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl
                          flex items-center gap-3 text-sm font-medium">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="text-gray-400 hover:text-white">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}