import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
const avatarColors = ['bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-red-500'];
const inputClass = 'w-full rounded-lg border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent/55 focus:ring-4 focus:ring-accent/10';

function Estrellas({ valor, onChange }) {
  const [hover, setHover] = useState(0);
  return <div className="flex gap-1">{[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" onClick={() => onChange?.(number)} onMouseEnter={() => onChange && setHover(number)} onMouseLeave={() => onChange && setHover(0)} className={`text-2xl transition-colors focus:outline-none ${number <= (hover || valor) ? 'text-amber-500' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`} aria-label={`${number} estrella${number > 1 ? 's' : ''}`}>★</button>)}</div>;
}

function ReviewCard({ review }) {
  const initial = review.nombre?.[0]?.toUpperCase() || '?';
  const color = avatarColors[review.nombre?.charCodeAt(0) % avatarColors.length] || 'bg-emerald-500';
  const date = new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  return <article className="flex flex-col gap-3 rounded-xl border border-ink/15 bg-white p-6"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${color}`}>{initial}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{review.nombre}</p>{review.ciudad && <p className="text-xs text-[#4B6355]">{review.ciudad}</p>}</div></div><time className="shrink-0 text-xs text-ink/40">{date}</time></div><Estrellas valor={review.estrellas} /><p className="text-sm leading-relaxed text-ink/75">&ldquo;{review.texto}&rdquo;</p></article>;
}

function ModalExito({ onClose }) {
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Reseña enviada"><div className="w-full max-w-sm rounded-xl border border-ink/15 bg-white p-8 text-center" onMouseDown={(event) => event.stopPropagation()}><h3 className="mb-2 text-xl font-bold text-ink">Gracias por tu reseña</h3><p className="mb-6 text-sm leading-relaxed text-[#4B6355]">Tu reseña ha sido enviada y está <strong>pendiente de revisión</strong>. La publicaremos cuando esté revisada.</p><button onClick={onClose} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">Entendido</button></div></div>;
}

export default function SectionReviews() {
  const { user, token, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nombre: '', ciudad: '', email: '', texto: '', estrellas: 0 });

  useEffect(() => { fetch(`${API_URL}/reviews`).then((response) => response.json()).then((data) => setReviews(Array.isArray(data) ? data : [])).catch(() => setReviews([])).finally(() => setCargando(false)); }, []);

  const mediaEstrellas = reviews.length ? (reviews.reduce((sum, review) => sum + review.estrellas, 0) / reviews.length).toFixed(1) : null;
  const handleChange = (field, value) => { setForm((previous) => ({ ...previous, [field]: value })); setError(''); };

  const handleEnviar = async (event) => {
    event.preventDefault();
    if (form.estrellas === 0) { setError('Por favor, selecciona una puntuación.'); return; }
    if (!form.texto.trim()) { setError('El texto de la reseña no puede estar vacío.'); return; }
    if (!isAuthenticated && !form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!isAuthenticated && !form.email.trim()) { setError('El email es obligatorio.'); return; }
    setEnviando(true); setError('');
    const body = { texto: form.texto.trim(), estrellas: form.estrellas, ciudad: form.ciudad.trim() || undefined, ...(isAuthenticated ? {} : { nombre: form.nombre.trim(), email: form.email.trim() }) };
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const response = await fetch(`${API_URL}/reviews`, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await response.json();
      if (response.ok) { setExito(true); setMostrarFormulario(false); setForm({ nombre: '', ciudad: '', email: '', texto: '', estrellas: 0 }); }
      else setError(data.detail || 'Error al enviar la reseña.');
    } catch { setError('Error de conexión. Inténtalo de nuevo.'); }
    finally { setEnviando(false); }
  };

  return <section className="w-full bg-[#F7FAF8] px-4 py-12 sm:py-16 lg:py-20"><div className="mx-auto max-w-[1120px]">
    <div className="mb-10 flex flex-col justify-between gap-6 sm:flex-row sm:items-end sm:gap-8"><div><p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent">Opiniones</p><h2 className="font-display text-[clamp(2.2rem,5vw,3.2rem)] font-black leading-tight text-ink">Lo que dicen<br />nuestros usuarios</h2></div>{mediaEstrellas && <div className="flex min-w-[180px] shrink-0 items-center gap-4 rounded-xl border border-ink/15 bg-white p-5"><div><p className="text-4xl font-black text-ink">{mediaEstrellas}</p><div className="mt-1 flex gap-0.5">{[1, 2, 3, 4, 5].map((number) => <span key={number} className={number <= Math.round(Number(mediaEstrellas)) ? 'text-base text-amber-500' : 'text-base text-gray-300'}>★</span>)}</div></div><div><p className="text-sm font-medium text-[#4B6355]">Valoración media</p><p className="text-xs text-ink/45">+{reviews.length} reseñas</p></div></div>}</div>

    {cargando && <div className="py-16 text-center text-[#4B6355]"><p>Cargando reseñas...</p></div>}
    {!cargando && reviews.length === 0 && <div className="mb-10 rounded-xl border border-dashed border-ink/20 bg-white p-10 text-center"><p className="mb-2 text-lg font-semibold text-ink">Todavía no hay reseñas</p><p className="mb-6 text-sm text-[#4B6355]">Sé el primero en compartir tu experiencia con CeliApp.</p><button onClick={() => setMostrarFormulario(true)} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">Dejar una reseña</button></div>}
    {!cargando && reviews.length > 0 && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div>}
    {!cargando && reviews.length > 0 && !mostrarFormulario && <div className="mt-8 text-center"><button onClick={() => setMostrarFormulario(true)} className="rounded-lg border border-accent/35 bg-white px-6 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/5">Dejar una reseña</button></div>}

    {mostrarFormulario && <div className="mt-8 rounded-xl border border-ink/15 bg-white p-6 sm:p-8"><h3 className="mb-1 text-xl font-bold text-ink">Escribe tu reseña</h3><p className="mb-6 text-sm text-[#4B6355]">{isAuthenticated ? `Hola, ${user?.full_name?.split(' ')[0] || 'usuario'}. Solo necesitamos tu opinión.` : 'Cuéntanos tu experiencia. Tu reseña se publicará tras revisión.'}</p><form onSubmit={handleEnviar} className="flex flex-col gap-4">{!isAuthenticated && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block text-xs font-semibold uppercase tracking-wide text-[#4B6355]">Nombre *<input type="text" value={form.nombre} onChange={(event) => handleChange('nombre', event.target.value)} placeholder="Tu nombre" className={`mt-1 ${inputClass}`} /></label><label className="block text-xs font-semibold uppercase tracking-wide text-[#4B6355]">Email *<input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} placeholder="tu@email.com" className={`mt-1 ${inputClass}`} /></label></div>}<label className="block text-xs font-semibold uppercase tracking-wide text-[#4B6355]">Ciudad (opcional)<input type="text" value={form.ciudad} onChange={(event) => handleChange('ciudad', event.target.value)} placeholder="Madrid, Barcelona..." className={`mt-1 sm:w-1/2 ${inputClass}`} /></label><div><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#4B6355]">Puntuación *</p><Estrellas valor={form.estrellas} onChange={(value) => handleChange('estrellas', value)} /></div><label className="block text-xs font-semibold uppercase tracking-wide text-[#4B6355]">Tu reseña *<textarea value={form.texto} onChange={(event) => handleChange('texto', event.target.value)} placeholder="Cuéntanos cómo te ha ayudado CeliApp..." rows={4} className={`mt-1 resize-none ${inputClass}`} /></label>{error && <p className="text-sm font-medium text-red-600">{error}</p>}<div className="flex flex-wrap gap-3 pt-1"><button type="submit" disabled={enviando} className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">{enviando ? 'Enviando...' : 'Enviar reseña'}</button><button type="button" onClick={() => { setMostrarFormulario(false); setError(''); }} className="rounded-lg bg-ink/[0.06] px-6 py-2.5 text-sm font-medium text-[#4B6355] transition-colors hover:bg-ink/10">Cancelar</button></div></form></div>}
  </div>{exito && <ModalExito onClose={() => setExito(false)} />}</section>;
}
