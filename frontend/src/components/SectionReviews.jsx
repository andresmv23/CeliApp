import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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
      style={{ background: '#f9f9f7', border: '1px solid #e8e3dd' }}
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
            <p className="font-semibold text-sm" style={{ color: '#1a1a1a' }}>{review.nombre}</p>
            {review.ciudad && <p className="text-xs" style={{ color: '#9a9490' }}>{review.ciudad}</p>}
          </div>
        </div>
        <span className="text-xs" style={{ color: '#b5b0ab' }}>{fecha}</span>
      </div>
      <Estrellas valor={review.estrellas} />
      <p className="text-sm leading-relaxed" style={{ color: '#4a4744' }}>
        &ldquo;{review.texto}&rdquo;
      </p>
    </div>
  );
}

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
        <h3 className="text-xl font-bold mb-2" style={{ color: '#1a1a1a' }}>¡Gracias por tu reseña!</h3>
        <p className="text-sm mb-6" style={{ color: '#6b6762' }}>
          Tu reseña ha sido enviada y está <strong>pendiente de revisión</strong>.
          La publicaremos en cuanto la revisemos. ¡Apreciamos mucho tu opinión!
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
          style={{ background: '#1e7e44' }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}

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
    <section className="w-full py-20 px-4" style={{ background: '#fff' }}>
      <div className="max-w-6xl mx-auto">

        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#1e7e44' }}>OPINIONES</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight" style={{ color: '#0f1c15' }}>
              Lo que dicen<br />nuestros usuarios
            </h2>
          </div>
          {mediaEstrellas && (
            <div
              className="rounded-2xl p-5 shrink-0 flex items-center gap-4"
              style={{ background: '#f5f3ef', border: '1px solid #e2ddd8', minWidth: 180 }}
            >
              <div>
                <p className="text-4xl font-black" style={{ color: '#0f1c15' }}>{mediaEstrellas}</p>
                <div className="flex gap-0.5 mt-1">
                  {[1,2,3,4,5].map(n => (
                    <span key={n} style={{ color: n <= Math.round(Number(mediaEstrellas)) ? '#f59e0b' : '#d1d5db', fontSize: 16 }}>★</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#6b6762' }}>Valoración media</p>
                <p className="text-xs" style={{ color: '#9a9490' }}>+{reviews.length} reseñas</p>
              </div>
            </div>
          )}
        </div>

        {/* Estado cargando */}
        {cargando && (
          <div className="text-center py-16" style={{ color: '#9a9490' }}>
            <div className="text-4xl mb-3 animate-pulse">🌾</div>
            <p>Cargando reseñas...</p>
          </div>
        )}

        {/* Sin reseñas */}
        {!cargando && reviews.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center mb-10"
            style={{ background: '#f9f9f7', border: '2px dashed #d6d0c9' }}
          >
            <div className="text-5xl mb-4">🌾</div>
            <p className="text-lg font-semibold mb-2" style={{ color: '#1a1a1a' }}>
              Todavía no hay reseñas
            </p>
            <p className="text-sm mb-6" style={{ color: '#6b6762' }}>
              Sé el primero en compartir tu experiencia con CeliApp.
            </p>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ background: '#1e7e44' }}
            >
              ¡Deja tu reseña!
            </button>
          </div>
        )}

        {/* Grid de reseñas */}
        {!cargando && reviews.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}

        {/* Botón dejar reseña (cuando ya hay reseñas) */}
        {!cargando && reviews.length > 0 && !mostrarFormulario && (
          <div className="text-center">
            <button
              onClick={() => setMostrarFormulario(true)}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
              style={{ background: '#f0fdf4', color: '#1e7e44', border: '1px solid rgba(30,126,68,0.3)' }}
            >
              ✍️ Dejar mi reseña
            </button>
          </div>
        )}

        {/* Formulario */}
        {mostrarFormulario && (
          <div
            className="rounded-2xl p-6 sm:p-8 mt-8"
            style={{ background: '#f9f9f7', border: '1px solid #e2ddd8' }}
          >
            <h3 className="text-xl font-bold mb-1" style={{ color: '#0f1c15' }}>Escribe tu reseña</h3>
            <p className="text-sm mb-6" style={{ color: '#6b6762' }}>
              {isAuthenticated
                ? `Hola, ${user?.full_name?.split(' ')[0] || 'usuario'} 👋 Solo necesitamos tu opinión.`
                : 'Cuéntanos tu experiencia. Tu reseña se publicará tras revisión.'}
            </p>

            <form onSubmit={handleEnviar} className="flex flex-col gap-4">

              {/* Campos solo para no logueados */}
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#6b6762' }}>Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => handleChange('nombre', e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#fff', border: '1px solid #d6d0c9', color: '#1a1a1a' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#6b6762' }}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#fff', border: '1px solid #d6d0c9', color: '#1a1a1a' }}
                    />
                  </div>
                </div>
              )}

              {/* Ciudad — todos */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#6b6762' }}>Ciudad (opcional)</label>
                <input
                  type="text"
                  value={form.ciudad}
                  onChange={e => handleChange('ciudad', e.target.value)}
                  placeholder="Madrid, Barcelona..."
                  className="w-full sm:w-1/2 px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid #d6d0c9', color: '#1a1a1a' }}
                />
              </div>

              {/* Puntuación */}
              <div>
                <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#6b6762' }}>Puntuación *</label>
                <Estrellas valor={form.estrellas} onChange={v => handleChange('estrellas', v)} />
              </div>

              {/* Texto */}
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: '#6b6762' }}>Tu reseña *</label>
                <textarea
                  value={form.texto}
                  onChange={e => handleChange('texto', e.target.value)}
                  placeholder="Cuéntanos cómo te ha ayudado CeliApp..."
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{ background: '#fff', border: '1px solid #d6d0c9', color: '#1a1a1a' }}
                />
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm font-medium" style={{ color: '#c0392b' }}>⚠️ {error}</p>
              )}

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={enviando}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#1e7e44' }}
                >
                  {enviando ? 'Enviando...' : 'Enviar reseña'}
                </button>
                <button
                  type="button"
                  onClick={() => { setMostrarFormulario(false); setError(''); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: '#f0ece8', color: '#6b6762' }}
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
