import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner';
import FotoAnalisis from './FotoAnalisis';
import SectionReviews from './SectionReviews';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function getStatusConfig(analisis) {
  if (!analisis) return null;
  if (analisis.es_apto === null || analisis.es_apto === undefined) {
    return {
      label: 'DUDOSO',
      bg: 'bg-dudoso',
      gradient: 'from-amber-50 to-amber-100',
      text: 'text-amber-900',
      icon: '?',
    };
  }

  return analisis.es_apto
    ? {
        label: 'APTO',
        bg: 'bg-accent',
        gradient: 'from-green-50 to-green-100',
        text: 'text-green-950',
        icon: '✓',
      }
    : {
        label: 'NO APTO',
        bg: 'bg-noapto',
        gradient: 'from-rose-50 to-rose-100',
        text: 'text-rose-900',
        icon: '✕',
      };
}

function useReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('visible');
        });
      },
      { threshold: 0.12 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
}

function SectionDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-px shrink-0 bg-[linear-gradient(90deg,transparent_0%,rgba(13,31,20,0.10)_20%,rgba(13,31,20,0.10)_80%,transparent_100%)]"
    />
  );
}

function TickerBand() {
  const items = Array(12).fill('SIN GLUTEN · CELIAPP ·');

  return (
    <div className="mx-auto my-8 max-w-[1120px] px-4">
      <div className="overflow-hidden py-2.5">
        <div className="flex animate-[ticker_22s_linear_infinite] gap-6 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-ink/20">
          {items.map((item, index) => (
            <span key={index}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function CameraIcon({ className = '', strokeWidth = 2 }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
    </svg>
  );
}

export default function Buscador() {
  const { token } = useAuth();
  const [ean, setEan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fotoOpen, setFotoOpen] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const resultRef = useRef(null);

  useReveal();

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const buscarProducto = async (event) => {
    event?.preventDefault();
    if (!ean.trim()) return;

    setLoading(true);
    setError(null);
    setResultado(null);
    setEsFavorito(false);
    setWrongCount(0);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await axios.get(`${API_URL}/producto/${ean}`, { headers });
      setResultado(response.data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } catch (requestError) {
      if (requestError.response?.status === 401) setError('Sesión caducada. Vuelve a entrar.');
      else if (requestError.response?.status === 404) setError('Producto no encontrado.');
      else if (requestError.response?.status === 429) setError('Límite alcanzado. Espera un momento.');
      else setError('Sin conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token) {
      showToast('Inicia sesión para guardar favoritos');
      return;
    }
    if (esFavorito) {
      showToast('Ya está en tus favoritos');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/favoritos`,
        { ean },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setEsFavorito(true);
      showToast('Añadido a favoritos');
    } catch {
      showToast('No se pudo guardar el favorito');
    }
  };

  const handleWrongProduct = () => {
    setWrongCount((count) => count + 1);
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
    OPEN_FOOD_FACTS: 'Open Food Facts',
    OFF_DIRECTO: 'Open Food Facts',
    OFF_ANALISIS_RAPIDO: 'Open Food Facts',
    OFF_VALIDADO_IA: 'OFF + IA',
    OFF_SIN_DATOS_GLUTEN: 'Open Food Facts',
    IA_PERPLEXITY: 'IA Perplexity',
    IA_GENERADA: 'IA Perplexity',
    IA_VISION: 'IA Vision',
    NO_ENCONTRADO: 'Sin fuente',
    BD_LOCAL: 'Base de datos local',
    ANALISIS_INGREDIENTES: 'Análisis de ingredientes',
    WEB_FABRICANTE: 'Web del fabricante',
    WEB_TERCEROS: 'Fuentes web',
    SIN_FUENTE_CONFIRMADA: 'Sin fuente confirmada',
  };
  const urlFuente = resultado?.analisis?.url_info ?? null;
  const fuenteTexto = fuenteLabel[resultado?.analisis?.fuente] ?? resultado?.analisis?.fuente ?? 'Desconocida';
  const fieldClass = 'w-full box-border rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-accent/45 focus:ring-4 focus:ring-accent/10';

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

      {fotoOpen && <FotoAnalisis ean={ean} onResult={handleFotoResult} onClose={() => setFotoOpen(false)} />}

      <div className="font-sans text-ink">
        <section className="overflow-hidden bg-surface px-4 py-10 sm:py-12 md:py-14 lg:py-20">
          <div className="mx-auto max-w-[1120px]">
            <div className="reveal mb-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-accent">
                Beta 1.0 — Gratis
              </span>
            </div>

            <h1 className="reveal mb-4 max-w-[820px] font-display text-[clamp(2.2rem,6vw,5.5rem)] font-bold leading-[1.08] tracking-[-0.02em] text-ink [transition-delay:80ms]">
              ¿Es este producto<br />
              <em className="italic text-accent">seguro</em>{' '}
              <span className="text-ink/40">para ti?</span>
            </h1>

            <p className="reveal mb-7 max-w-[460px] text-[clamp(0.95rem,1.5vw,1.1rem)] leading-7 text-[#4B6355] [transition-delay:140ms]">
              Introduce el código de barras y nuestra IA analiza cada ingrediente al instante. Sin dudas, sin riesgos.
            </p>

            <form className="reveal mb-4 max-w-[580px] [transition-delay:200ms]" onSubmit={buscarProducto}>
              <div className="flex flex-wrap items-center gap-0 rounded-2xl border-[1.5px] border-ink/10 bg-white p-2 shadow-[0_2px_12px_rgba(13,31,20,0.05)] sm:flex-nowrap sm:gap-1 sm:rounded-full sm:p-1.5">
                <span className="flex shrink-0 items-center pl-3.5 text-ink/25">
                  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Introduce el código EAN"
                  value={ean}
                  onChange={(event) => setEan(event.target.value)}
                  className="order-1 w-full min-w-0 bg-transparent px-2 py-2.5 text-[0.9375rem] text-ink outline-none sm:order-none sm:w-auto sm:flex-1"
                />
                <button
                  type="button"
                  onClick={() => setScannerOpen(true)}
                  title="Escanear código de barras"
                  className="order-2 ml-auto flex shrink-0 items-center rounded-full p-2.5 text-ink/30 transition hover:text-accent sm:order-none sm:ml-0"
                >
                  <CameraIcon className="h-5 w-5" strokeWidth={1.8} />
                </button>
                <button
                  type="submit"
                  disabled={loading || !ean.trim()}
                  className="order-3 mt-1.5 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl bg-accent px-5.5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-accent/30 sm:order-none sm:mt-0 sm:w-auto sm:rounded-full"
                >
                  {loading ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analizando…
                    </>
                  ) : 'Verificar'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mb-4 flex max-w-[580px] items-start gap-2.5 rounded-2xl border border-red-600/15 bg-red-600/5 px-4 py-3.5 text-sm text-red-600">
                <svg className="mt-px h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <div className="reveal [transition-delay:320ms]">
              <p className="flex flex-wrap gap-x-6 gap-y-1 text-[0.8125rem] font-medium tracking-[0.01em] text-ink/45">
                <span>+50.000 productos analizados</span>
                <span className="hidden text-ink/10 sm:inline">·</span>
                <span>99% de precisión</span>
                <span className="hidden text-ink/10 sm:inline">·</span>
                <span>Gratis, sin suscripción</span>
              </p>
            </div>
          </div>
        </section>

        <SectionDivider />

        {resultado && !loading && cfg && (
          <section ref={resultRef} className="bg-surface px-4 py-12">
            <div className="mx-auto max-w-[1120px]">
              <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink/45">Resultado del análisis</p>
              <div className="max-w-[640px] overflow-hidden rounded-3xl border border-ink/10 shadow-[0_8px_40px_rgba(13,31,20,0.07)]">
                <div className={`flex items-start justify-between gap-4 bg-gradient-to-br ${cfg.gradient} p-5`}>
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg} text-sm font-extrabold text-white`}>
                        {cfg.icon}
                      </span>
                      <span className={`text-[0.8rem] font-extrabold uppercase tracking-[0.1em] ${cfg.text}`}>{cfg.label}</span>
                    </div>
                    <p className={`mb-3 text-sm leading-relaxed ${cfg.text} opacity-85`}>
                      {resultado.analisis?.motivo ?? 'Análisis no disponible'}
                    </p>
                    <div className={`text-xs ${cfg.text} opacity-70`}>
                      <span>Fuente: {fuenteTexto}</span>
                      {urlFuente && (
                        <>
                          {' · '}
                          <a href={urlFuente} target="_blank" rel="noopener noreferrer" className="underline">
                            Ver fuente original
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleFavorito}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.07)] transition hover:scale-110"
                    aria-label="Guardar en favoritos"
                  >
                    {esFavorito ? (
                      <svg className="h-4 w-4 fill-noapto" viewBox="0 0 24 24"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="rgba(13,31,20,0.32)" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="bg-white">
                  {resultado.producto?.imagen_url && (
                    <div className="relative h-[220px] w-full overflow-hidden border-b border-ink/10">
                      <div
                        className="absolute inset-0 scale-115 bg-cover bg-center opacity-35 blur-[28px] brightness-90 saturate-50"
                        style={{ backgroundImage: `url(${resultado.producto.imagen_url})` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-surface/30 to-surface/50" />
                      <div className="absolute inset-0 flex items-center justify-center p-6">
                        <img
                          src={resultado.producto.imagen_url}
                          alt={resultado.producto?.nombre ?? 'Producto'}
                          className="relative z-10 max-h-[180px] max-w-[80%] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.14)]"
                          onError={(event) => { event.currentTarget.parentElement.parentElement.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-5">
                    <h2 className="mb-1.5 text-lg font-extrabold leading-tight text-ink">{resultado.producto?.nombre ?? 'Producto sin nombre'}</h2>
                    <span className="mb-5 inline-block rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/50">
                      {resultado.producto?.marca ?? 'Marca desconocida'}
                    </span>

                    <div className="mb-4 rounded-2xl bg-surface p-4">
                      <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p>
                      <p className="text-[0.8125rem] leading-relaxed text-ink/80">{resultado.producto?.ingredientes ?? 'No disponible.'}</p>
                    </div>

                    {wrongCount === 0 ? (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/5 bg-ink/[0.03] px-4 py-3">
                        <p className="text-[0.8125rem] text-ink/55">¿El resultado no corresponde al producto que tienes?</p>
                        <button onClick={handleWrongProduct} className="shrink-0 text-[0.8125rem] font-bold text-ink/45 transition hover:text-accent">
                          No es mi producto
                        </button>
                      </div>
                    ) : (
                      <div className="mb-4 overflow-hidden rounded-2xl border border-accent/20 bg-gradient-to-br from-green-50 to-green-100">
                        <div className="p-5">
                          <div className="mb-4 flex items-start gap-3.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                              <CameraIcon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                            </div>
                            <div>
                              <p className="mb-1 text-sm font-extrabold text-ink">¿Quieres un análisis más preciso?</p>
                              <p className="text-[0.8125rem] leading-relaxed text-ink/65">Haz una foto a la etiqueta de ingredientes o al frente del envase. Nuestra IA lo identificará visualmente.</p>
                            </div>
                          </div>
                          <button onClick={() => setFotoOpen(true)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(22,163,74,0.22)] transition hover:bg-green-700">
                            <CameraIcon className="h-4 w-4" />
                            Analizar con foto del producto
                          </button>
                        </div>
                        <div className="px-5 pb-4">
                          <button onClick={() => setWrongCount(0)} className="text-[0.8125rem] text-ink/45 transition hover:text-ink/75">
                            No, el resultado es correcto
                          </button>
                        </div>
                      </div>
                    )}

                    <button onClick={() => { setResultado(null); setEan(''); setWrongCount(0); }} className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-ink/45 transition hover:text-accent">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        <section id="como-funciona" className="bg-[#F0F4F1] px-4 py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1120px]">
            <div className="reveal mb-10 max-w-[520px]">
              <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Cómo funciona</p>
              <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">Tres pasos.<br />Resultado inmediato.</h2>
            </div>

            <div className="grid overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-3 md:gap-px">
              {[
                { num: '01', titulo: 'Introduce el código', desc: 'Escribe manualmente el código EAN o usa la cámara para escanearlo directamente desde el envase.' },
                { num: '02', titulo: 'La IA lo analiza', desc: 'Nuestra IA revisa cada ingrediente, aditivo y posible traza de gluten en segundos.' },
                { num: '03', titulo: 'Respuesta clara', desc: 'Recibes APTO, NO APTO o DUDOSO con la explicación exacta del motivo.' },
              ].map(({ num, titulo, desc }) => (
                <div key={num} className="reveal bg-white px-6 py-7">
                  <span className="mb-4 block text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-accent">{num}</span>
                  <h3 className="mb-2 text-base font-bold leading-snug text-ink">{titulo}</h3>
                  <p className="text-sm leading-relaxed text-[#4B6355]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionDivider />

        <SectionReviews />
        <TickerBand />

        <section id="sobre-celiapp" className="bg-surface px-4 py-10 sm:py-14 md:py-16 lg:py-20">
          <div className="mx-auto max-w-[1120px]">
            <div className="grid items-start gap-8 min-[640px]:grid-cols-2 min-[640px]:gap-[clamp(2rem,5vw,4rem)]">
              <div className="reveal">
                <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Contacto</p>
                <h2 className="mb-5 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">¿Tienes alguna<br />pregunta?</h2>
                <p className="mb-8 text-[0.9375rem] leading-7 text-[#4B6355]">Estamos aquí para ayudarte. Si tienes dudas sobre un producto, quieres reportar un error o simplemente quieres saber más, escríbenos.</p>
                <div className="flex flex-col gap-5">
                  {[
                    { label: 'Email', val: 'hola@celiapp.es' },
                    { label: 'Ubicación', val: 'Barcelona, España' },
                    { label: 'Respuesta en', val: 'menos de 24 horas' },
                  ].map((contact) => (
                    <div key={contact.label}>
                      <p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#4B6355]">{contact.label}</p>
                      <p className="text-[0.9375rem] font-semibold text-ink">{contact.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="reveal rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_4px_24px_rgba(13,31,20,0.06)]">
                <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); showToast('✓ Mensaje enviado. Te respondemos pronto.'); event.target.reset(); }}>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[{ label: 'Nombre', type: 'text', placeholder: 'Tu nombre' }, { label: 'Email', type: 'email', placeholder: 'tu@email.com' }].map((field) => (
                      <div key={field.label}>
                        <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">{field.label}</label>
                        <input type={field.type} placeholder={field.placeholder} required className={fieldClass} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">Asunto</label>
                    <select className={fieldClass}>
                      <option>Duda sobre un producto</option>
                      <option>Reportar un error</option>
                      <option>Sugerencia de mejora</option>
                      <option>Colaboración</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">Mensaje</label>
                    <textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required className={`${fieldClass} resize-none`} />
                  </div>
                  <button type="submit" className="rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-green-700">Enviar mensaje</button>
                </form>
              </div>
            </div>
          </div>
        </section>

        <footer className="bg-surface">
          <div className="h-px w-full bg-ink/10" />
          <div className="mx-auto max-w-[1120px] px-4 py-10 sm:py-12">
            <div className="mb-10 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.5fr)_repeat(3,1fr)]">
              <div>
                <div className="mb-3.5 flex items-center gap-3">
                  <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <rect width="32" height="32" rx="9" fill="#16a34a" />
                    <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                    <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                    <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                    <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                    <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                    <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
                  </svg>
                  <span className="font-display text-base font-bold text-ink">CeliApp</span>
                </div>
                <p className="mb-5 max-w-[220px] text-sm leading-relaxed text-[#4B6355]">Análisis de gluten al instante. Para que comer bien no sea una aventura.</p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-accent">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" />
                    <path d="M3.5 6l1.8 1.8L8.5 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Sin gluten verificado
                </span>
              </div>

              {[
                { title: 'Producto', links: ['Cómo funciona', 'Verificar producto', 'Análisis por foto', 'Favoritos'], href: '#' },
                { title: 'Empresa', links: ['Sobre CeliApp', 'Contacto', 'Blog', 'Colaboraciones'], href: '#sobre-celiapp' },
                { title: 'Legal', links: ['Privacidad', 'Términos de uso', 'Cookies', 'Aviso legal'], href: '#' },
              ].map((group) => (
                <div key={group.title}>
                  <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-ink/40">{group.title}</p>
                  <div className="flex flex-col gap-2.5">
                    {group.links.map((link) => (
                      <a key={link} href={group.href} className="text-sm text-[#4B6355] transition hover:text-ink">{link}</a>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-6 h-px bg-ink/10" />
            <div className="flex flex-col items-start justify-between gap-2 text-[0.8125rem] sm:flex-row sm:flex-wrap">
              <span className="text-ink/40">© 2026 CeliApp — Hecho con cuidado en Barcelona, España</span>
              <span className="text-ink/35">No sustituye el consejo médico. Verifica siempre el etiquetado.</span>
            </div>
          </div>
        </footer>

        {toastMsg && (
          <div className="fixed inset-x-3 bottom-3 z-50 sm:left-auto sm:right-4 sm:bottom-4 sm:w-auto">
            <div className="flex items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-surface shadow-[0_8px_32px_rgba(13,31,20,0.22)]">
              <span className="flex-1">{toastMsg}</span>
              <button onClick={() => setToastMsg('')} className="flex shrink-0 text-surface/40 transition hover:text-surface" aria-label="Cerrar notificación">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes ticker {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .reveal {
            opacity: 0;
            transform: translateY(18px);
            transition: opacity 0.55s ease, transform 0.55s ease;
          }
          .reveal.visible {
            opacity: 1;
            transform: none;
          }
        `}</style>
      </div>
    </>
  );
}
