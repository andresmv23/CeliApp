import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function BadgeGluten({ estado }) {
  const styles = {
    APTO: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    NO_APTO: 'border-red-200 bg-red-50 text-red-700',
    TRAZAS: 'border-amber-200 bg-amber-50 text-amber-700',
    DUDOSO: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wide ${styles[estado] ?? 'border-ink/10 bg-ink/5 text-ink/60'}`}>
      {estado?.replace('_', ' ') ?? 'DUDOSO'}
    </span>
  );
}

function HeartIcon({ filled = false, className = '' }) {
  return (
    <svg className={className} fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={filled ? 0 : 1.7} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6 md:py-10">
      <div className="mb-8 h-36 rounded-3xl bg-ink/10" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-ink/10" />
        <div className="h-80 rounded-3xl bg-ink/10" />
      </div>
    </div>
  );
}

function ProductModal({ producto, loading, error, isFavorite, onClose, onToggleFavorite }) {
  const analysis = producto?.analisis;
  const item = producto?.producto;
  const status = analysis?.estado ?? 'DUDOSO';
  const statusStyle = {
    APTO: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    NO_APTO: 'border-red-200 bg-red-50 text-red-800',
    TRAZAS: 'border-amber-200 bg-amber-50 text-amber-800',
    DUDOSO: 'border-amber-200 bg-amber-50 text-amber-800',
  }[status] ?? 'border-ink/10 bg-ink/5 text-ink';

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Detalle del producto" onMouseDown={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(13,31,20,0.28)] sm:rounded-3xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink/10 bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Detalle del producto</p>
            {item?.ean && <p className="mt-0.5 text-xs text-ink/45">EAN {item.ean}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar detalle" className="rounded-xl p-2 text-ink/45 transition hover:bg-ink/5 hover:text-ink">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : error ? (
          <div className="m-6 rounded-2xl border border-red-600/15 bg-red-600/5 p-5 text-sm text-red-600">{error}</div>
        ) : item ? (
          <div className="p-5 sm:p-7">
            <div className="mb-6 flex flex-col gap-5 sm:flex-row">
              {item.imagen_url && (
                <div className="flex h-44 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink/10 bg-surface p-4 sm:w-44">
                  <img src={item.imagen_url} alt={item.nombre} className="h-full w-full object-contain" onError={(event) => { event.currentTarget.parentElement.style.display = 'none'; }} />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <BadgeGluten estado={status} />
                  {analysis?.confianza && <span className="text-xs capitalize text-ink/45">Confianza {analysis.confianza}</span>}
                </div>
                <h2 className="mb-1 font-display text-2xl font-bold leading-tight tracking-[-0.02em] text-ink">{item.nombre ?? 'Producto sin nombre'}</h2>
                <p className="text-sm text-[#4B6355]">{item.marca ?? 'Marca desconocida'}</p>
              </div>
            </div>

            <div className={`mb-5 rounded-2xl border p-4 ${statusStyle}`}>
              <p className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] opacity-65">Resultado del análisis</p>
              <p className="text-sm leading-relaxed">{analysis?.motivo ?? 'No hay explicación disponible.'}</p>
              {analysis?.url_info && (
                <a className="mt-3 inline-flex text-sm font-semibold underline underline-offset-2" href={analysis.url_info} target="_blank" rel="noopener noreferrer">Ver fuente original</a>
              )}
            </div>

            <div className="mb-6 rounded-2xl bg-surface p-4">
              <p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p>
              <p className="text-sm leading-relaxed text-ink/80">{item.ingredientes || 'No hay ingredientes disponibles para este producto.'}</p>
            </div>

            <button onClick={onToggleFavorite} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${isFavorite ? 'border border-red-600/20 bg-red-600/5 text-red-600 hover:bg-red-600/10' : 'bg-accent text-white hover:bg-green-700'}`}>
              <HeartIcon filled={isFavorite} className="h-4 w-4" />
              {isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Perfil() {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [modal, setModal] = useState({ open: false, loading: false, error: '', producto: null, ean: null });

  const showToast = (message) => {
    setToastMsg(message);
    window.setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    axios.get(`${API_URL}/users/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setPerfil(response.data))
      .catch((requestError) => {
        setError(requestError.response?.status === 401 ? 'Tu sesión ha caducado. Vuelve a iniciar sesión.' : 'Error cargando tu perfil. Por favor, inténtalo de nuevo.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const favoritos = perfil?.favoritos ?? [];
  const isFavorite = (ean) => favoritos.some((producto) => producto.ean === ean);

  const eliminarFavorito = async (ean) => {
    await axios.delete(`${API_URL}/favoritos/${ean}`, { headers: { Authorization: `Bearer ${token}` } });
    setPerfil((previous) => ({ ...previous, favoritos: previous.favoritos.filter((producto) => producto.ean !== ean) }));
  };

  const alternarFavorito = async (ean) => {
    try {
      if (isFavorite(ean)) {
        await eliminarFavorito(ean);
        showToast('Favorito eliminado');
      } else {
        await axios.post(`${API_URL}/favoritos`, { ean }, { headers: { Authorization: `Bearer ${token}` } });
        const productData = modal.producto?.producto;
        setPerfil((previous) => ({
          ...previous,
          favoritos: [...(previous.favoritos ?? []), {
            ean,
            nombre: productData?.nombre ?? 'Producto guardado',
            marca: productData?.marca ?? 'Marca desconocida',
            estado_gluten: modal.producto?.analisis?.estado ?? 'DUDOSO',
          }],
        }));
        showToast('Añadido a favoritos');
      }
    } catch {
      showToast('No se pudo actualizar el favorito');
    }
  };

  const abrirProducto = async (ean) => {
    setModal({ open: true, loading: true, error: '', producto: null, ean });
    try {
      const response = await axios.get(`${API_URL}/producto/${ean}`, { headers: { Authorization: `Bearer ${token}` } });
      setModal({ open: true, loading: false, error: '', producto: response.data, ean });
    } catch {
      setModal({ open: true, loading: false, error: 'No se pudo cargar el detalle de este producto. Inténtalo de nuevo.', producto: null, ean });
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h2 className="mb-2 font-display text-xl font-bold text-ink">Inicia sesión para ver tu perfil</h2>
        <p className="text-sm text-[#4B6355]">Guarda tus productos favoritos y consulta tu historial.</p>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-surface"><Skeleton /></div>;

  if (error || !perfil) {
    return <div className="flex min-h-screen items-center justify-center bg-surface px-4"><div className="max-w-md rounded-2xl border border-red-600/15 bg-red-600/5 p-6 text-center text-sm font-medium text-red-600">{error || 'No se pudo cargar la información del usuario'}</div></div>;
  }

  const nombre = perfil.usuario?.full_name || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        <section className="mb-8 flex flex-col items-start justify-between gap-4 rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_4px_24px_rgba(13,31,20,0.07)] sm:flex-row sm:items-center sm:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-xl font-black text-white">{inicial}</div>
            <div>
              <h1 className="text-xl font-black text-ink">{nombre}</h1>
              <p className="mt-0.5 text-sm text-[#4B6355]">{perfil.usuario?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-accent/15 bg-accent/10 px-5 py-3">
            <HeartIcon filled className="h-4 w-4 text-accent" />
            <div><span className="block text-2xl font-black leading-none text-green-700">{favoritos.length}</span><span className="text-xs font-semibold uppercase tracking-wider text-accent">Favoritos</span></div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_4px_24px_rgba(13,31,20,0.05)]">
            <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink"><HeartIcon filled className="h-4 w-4 text-accent" />Favoritos</h2>
              <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-bold text-ink/50">{favoritos.length}</span>
            </div>
            {!favoritos.length ? <EmptyState title="Sin favoritos aún" description="Escanea un producto y guárdalo aquí" /> : (
              <ul className="max-h-[480px] flex-1 overflow-y-auto p-3">
                {favoritos.map((product) => <ProductRow key={product.ean} item={product} favorite onOpen={abrirProducto} />)}
              </ul>
            )}
          </section>

          <section className="flex min-h-[320px] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_4px_24px_rgba(13,31,20,0.05)]">
            <div className="flex items-center gap-2 border-b border-ink/10 px-6 py-4">
              <svg className="h-4 w-4 text-ink/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink">Historial reciente</h2>
            </div>
            {!perfil.historial?.length ? <EmptyState title="Sin búsquedas aún" description="Tus consultas recientes aparecerán aquí" /> : (
              <ul className="max-h-[480px] flex-1 overflow-y-auto p-3">
                {perfil.historial.map((item, index) => <ProductRow key={`${item.ean}-${item.fecha}-${index}`} item={item} onOpen={abrirProducto} />)}
              </ul>
            )}
          </section>
        </div>
      </div>

      {modal.open && <ProductModal producto={modal.producto} loading={modal.loading} error={modal.error} isFavorite={isFavorite(modal.ean)} onClose={() => setModal({ open: false, loading: false, error: '', producto: null, ean: null })} onToggleFavorite={() => alternarFavorito(modal.ean)} />}

      {toastMsg && <div className="fixed inset-x-3 bottom-3 z-[80] sm:left-auto sm:right-6 sm:w-auto"><div className="flex items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-white shadow-[0_8px_32px_rgba(13,31,20,0.22)]">{toastMsg}</div></div>}
    </div>
  );
}

function EmptyState({ title, description }) {
  return <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"><p className="mb-1 font-semibold text-ink/75">{title}</p><p className="text-sm text-ink/40">{description}</p></div>;
}

function ProductRow({ item, favorite = false, onOpen }) {
  const fecha = item.fecha ? new Date(item.fecha) : null;

  return (
    <li>
      <button onClick={() => onOpen(item.ean)} className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-4 py-3.5 text-left transition hover:border-ink/10 hover:bg-surface focus:outline-none focus:ring-4 focus:ring-accent/10">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink transition group-hover:text-accent">{item.nombre || 'Producto sin nombre'}</p>
          <p className="mt-0.5 truncate text-xs text-[#4B6355]">{item.marca || 'Marca desconocida'}</p>
          {fecha && <p className="mt-1.5 text-xs text-ink/40">{fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })} · {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2"><BadgeGluten estado={item.estado_gluten} />{favorite && <HeartIcon filled className="h-4 w-4 text-accent" />}<svg className="h-4 w-4 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg></div>
      </button>
    </li>
  );
}
