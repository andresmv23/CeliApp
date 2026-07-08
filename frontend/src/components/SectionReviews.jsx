import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const BG      = '#F7FAF8';
const TEXT    = '#0D1F14';
const MUTED   = '#4B6355';
const PRIMARY = '#16a34a';
const BORDER  = 'rgba(13,31,20,0.08)';

/* ─── Componente de estrellas ─────────────────────────────────────── */
function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className="text-2xl transition-transform hover:scale-110 focus:outline-none"
          style={{ color: n <= (hover || valor) ? '#f59e0b' : '#d1d5db', cursor: onChange ? 'pointer' : 'default' }}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Tarjeta de reseña ───────────────────────────────────────────── */
function ReviewCard({ review }) {
  const inicial = review.nombre?.[0]?.toUpperCase() || '?';
  const colores = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];
  const color = colores[review.nombre?.charCodeAt(0) % colores.length] || '#10b981';
  const fecha = new Date(review.created_at).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: color }}
          >
            {inicial}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: TEXT }}>{review.nombre}</p>
            {review.ciudad && <p className="text-xs" style={{ color: MUTED }}>{review.ciudad}</p>}
          </div>
        </div>
        <span className="text-xs" style={{ color: 'rgba(13,31,20,0.40)' }}>{fecha}</span>
      </div>
      <Estrellas valor={review.estrellas} />
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(13,31,20,0.75)' }}>
        &ldquo;{review.texto}&rdquo;
      </p>
    </div>
  );
}

/* ─── Modal éxito ─────────────────────────────────────────────────── */
function ModalExito({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-8 max-w-sm w-full text-center"
        style={{ background: '#fff' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-5xl mb-4">✅</div>
        <h3 className="text-xl font-bold mb-2" style={{ color: TEXT }}>¡Gracias por tu reseña!</h3>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          Tu reseña ha sido enviada y está <strong>pendiente de revisión</strong>.
          La publicaremos en cuanto la revisemos. ¡Apreciamos mucho tu opinión!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: PRIMARY }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

/* ─── Banda tipográfica separadora ────────────────────────────────── */
function TickerBand() {
  const items = Array(10).fill('SIN GLUTEN · CELIAPP ·');
  return (
    <div
      className="w-full overflow-hidden py-3 my-10"
      style={{ borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}
    >
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
  );
}

/* ─── Sección principal ───────────────────────────────────────────── */
export default function SectionReviews() {
  const { user, token, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    nombre: '', ciudad: '', email: '', texto: '', estrellas: 0,
  });

  useEffect(() => {
    fetch(`${API_URL}/reviews`)
      .then(r => r.json())
      .then(data => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setCargando(false));
  }, []);

  const mediaEstrellas = reviews.length
    ? (reviews.reduce((s, r) => s + r.estrellas, 0) / reviews.length).toFixed(1)
    : null;

  const handleChange = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setError('');
  };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (form.estrellas === 0) { setError('Por favor, selecciona una puntuación.'); return; }
    if (!form.texto.trim()) { setError('El texto de la reseña no puede estar vacío.'); return; }
    if (!isAuthenticated) {
      if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
      if (!form.email.trim()) { setError('El email es obligatorio.'); return; }
    }

    setEnviando(true);
    setError('');

    const body = {
      texto: form.texto.trim(),
      estrellas: form.estrellas,
      ciudad: form.ciudad.trim() || undefined,
      ...(isAuthenticated ? {} : {
        nombre: form.nombre.trim(),
        email: form.email.trim(),
      }),
    };

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setExito(true);
        setMostrarFormulario(false);
        setForm({ nombre: '', ciudad: '', email: '', texto: '', estrellas: 0 });
      } else {
        setError(data.detail || 'Error al enviar la reseña.');
      }
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="w-full py-20" style={{ background: BG }}>
      {/* Contenedor alineado con el resto de secciones */}
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p
              className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: PRIMARY }}
            >
              OPINIONES
            </p>
            <h2
              className="leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
                fontWeight: 900,
                color: TEXT,
              }}
            >
              Lo que dicen<br />nuestros usuarios
            </h2>
          </div>
          {mediaEstrellas && (
            <div
              className="rounded-2xl p-5 shrink-0 flex items-center gap-4"
              style={{ background: '#fff', border: `1px solid ${BORDER}`, minWidth: 180 }}
            >
              <div>
                <p className="text-4xl font-black" style={{ color: TEXT }}>{mediaEstrellas}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ color: n <= Math.round(Number(mediaEstrellas)) ? '#f59e0b' : '#d1d5db', fontSize: 16 }}>★</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: MUTED }}>Valoración media</p>
                <p className="text-xs" style={{ color: 'rgba(13,31,20,0.45)' }}>+{reviews.length} reseñas</p>
              </div>
            </div>
          )}
        </div>

        {/* Estado cargando */}
        {cargando && (
          <div className="text-center py-16" style={{ color: MUTED }}>
            <div className="text-4xl mb-3 animate-pulse">🌾</div>
            <p>Cargando reseñas...</p>
          </div>
        )}

        {/* Sin reseñas */}
        {!cargando && reviews.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center mb-10"
            style={{ background: '#fff', border: `2px dashed ${BORDER}` }}
          >
            <div className="text-5xl mb-4">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto' }}>
                <rect width="32" height="32" rx="9" fill="#16a34a" />
                <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2" style={{ color: TEXT }}>
              Todavía no hay reseñas
            </p>
            <p className="text-sm mb-6" style={{ color: MUTED }}>
              Sé el primero en compartir tu experiencia con CeliApp.
            </p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              ¡Deja tu reseña!
            </button>
          </div>
        )}

        {/* Grid de reseñas */}
        {!cargando && reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}

        {/* Banda tipográfica separadora */}
        {!cargando && <TickerBand />}

        {/* Botón dejar reseña (cuando ya hay reseñas) */}
        {!cargando && reviews.length > 0 && !mostrarFormulario && (
          <div className="text-center">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: '#fff', color: PRIMARY, border: `1px solid rgba(22,163,74,0.30)` }}
            >
              ✍️ Dejar mi reseña
            </button>
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div
            className="rounded-2xl p-6 sm:p-8 mt-8"
            style={{ background: '#fff', border: `1px solid ${BORDER}` }}
          >
            <h3 className="text-xl font-bold mb-1" style={{ color: TEXT }}>Escribe tu reseña</h3>
            <p className="text-sm mb-6" style={{ color: MUTED }}>
              {isAuthenticated
                ? `Hola, ${user?.full_name?.split(' ')[0] || 'usuario'} 👋 Solo necesitamos tu opinión.`
                : 'Cuéntanos tu experiencia. Tu reseña se publicará tras revisión.'}
            </p>

            <form onSubmit={handleEnviar} className="flex flex-col gap-4">

              {/* Campos solo para no logueados */}
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: MUTED }}>Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => handleChange('nombre', e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: MUTED }}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
                    />
                  </div>
                </div>
              )}

              {/* Ciudad — todos */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: MUTED }}>Ciudad (opcional)</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={e => handleChange('ciudad', e.target.value)}
                  placeholder="Madrid, Barcelona..."
                  className="w-full sm:w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
                />
              </div>

              {/* Puntuación */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: MUTED }}>Puntuación *</label>
                <Estrellas valor={form.estrellas} onChange={v => handleChange('estrellas', v)} />
              </div>

              {/* Texto */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: MUTED }}>Tu reseña *</label>
                <textarea
                  value={form.texto}
                  onChange={e => handleChange('texto', e.target.value)}
                  placeholder="Cuéntanos cómo te ha ayudado CeliApp..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: BG, border: `1px solid ${BORDER}`, color: TEXT }}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm font-medium" style={{ color: '#dc2626' }}>⚠️ {error}</p>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: PRIMARY }}
                >
                  {enviando ? 'Enviando...' : 'Enviar reseña'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarFormulario(false); setError(''); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: 'rgba(13,31,20,0.06)', color: MUTED }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {exito && <ModalExito onClose={() => setExito(false)} />}
    </section>
  );
}
