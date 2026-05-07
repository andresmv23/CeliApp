import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/* ─── Helpers ──────────────────────────────────────────── */
function BadgeGluten({ estado }) {
  const map = {
    APTO:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
    NO_APTO: 'bg-red-50 text-red-700 border border-red-200',
    DUDOSO:  'bg-amber-50 text-amber-700 border border-amber-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${map[estado] ?? 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
      {estado?.replace('_', ' ') ?? 'DUDOSO'}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-10 animate-pulse">
      <div className="h-32 bg-gray-200 rounded-2xl mb-8"/>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 rounded-2xl"/>
        <div className="h-80 bg-gray-200 rounded-2xl"/>
      </div>
    </div>
  );
}

/* ─── Componente ───────────────────────────────────────── */
export default function Perfil({ setVista }) {
  const { token } = useAuth();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    axios.get(`${API_URL}/users/perfil`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPerfil(r.data))
      .catch(err => {
        if (err.response?.status === 401) {
          setError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
        } else {
          setError('Error cargando tu perfil. Por favor, inténtalo de nuevo.');
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const eliminarFavorito = async (ean) => {
    try {
      await axios.delete(`${API_URL}/favoritos/${ean}`, { headers: { Authorization: `Bearer ${token}` } });
      setPerfil(prev => ({ ...prev, favoritos: prev.favoritos.filter(p => p.ean !== ean) }));
      showToast('Favorito eliminado');
    } catch {
      showToast('No se pudo eliminar el favorito');
    }
  };

  // Sin token — pide login
  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center" style={{ background: '#f4f3f0' }}>
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Inicia sesión para ver tu perfil</h2>
        <p className="text-gray-500 text-sm mb-6">Guarda tus productos favoritos y consulta tu historial.</p>
        <button onClick={() => setVista?.('login')}
          className="px-6 py-3 rounded-xl font-semibold text-sm text-white"
          style={{ background: '#10b981' }}>
          Iniciar sesión
        </button>
      </div>
    );
  }

  if (loading) return <div style={{ background: '#f4f3f0', minHeight: '100vh' }}><Skeleton /></div>;

  if (error || !perfil) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#f4f3f0' }}>
      <div className="text-center p-6 bg-red-50 text-red-700 rounded-2xl border border-red-100 max-w-md text-sm font-medium">
        {error || 'No se pudo cargar la información del usuario'}
      </div>
    </div>
  );

  const nombre  = perfil.usuario?.full_name || 'Usuario';
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <div style={{ background: '#f4f3f0', minHeight: '100vh' }}>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">

        {/* Header */}
        <div className="card p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-xl font-black shrink-0">
              {inicial}
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{nombre}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{perfil.usuario?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-5 py-3">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
            </svg>
            <div>
              <span className="text-2xl font-black text-emerald-700 leading-none block">{perfil.favoritos?.length ?? 0}</span>
              <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Favoritos</span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Favoritos */}
          <div className="card flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
                </svg>
                Favoritos
              </h2>
              <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {perfil.favoritos?.length ?? 0}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-area max-h-[480px]">
              {!perfil.favoritos?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                    </svg>
                  </div>
                  <p className="font-semibold text-gray-700 mb-1">Sin favoritos aún</p>
                  <p className="text-sm text-gray-400">Escanea un producto y guárdalo aquí</p>
                </div>
              ) : (
                <ul className="p-3 space-y-2">
                  {perfil.favoritos.map((prod) => (
                    <li key={prod.ean}
                      className="group flex items-center justify-between gap-3 rounded-xl px-4 py-3 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all duration-150">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-emerald-600 transition-colors">
                          {prod.nombre}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{prod.marca}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <BadgeGluten estado={prod.estado_gluten} />
                        <button
                          onClick={() => eliminarFavorito(prod.ean)}
                          title="Eliminar favorito"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Historial */}
          <div className="card flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h2 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Historial reciente</h2>
            </div>
            <div className="flex-1 overflow-y-auto scroll-area max-h-[480px]">
              {!perfil.historial?.length ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <p className="font-semibold text-gray-700 mb-1">Sin búsquedas aún</p>
                  <p className="text-sm text-gray-400">Tus consultas recientes aparecerán aquí</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {perfil.historial.map((item, i) => {
                    const fecha = new Date(item.fecha);
                    return (
                      <li key={i} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{item.nombre}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-400">
                              {fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">
                              {fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <BadgeGluten estado={item.estado_gluten} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium">
              <span>{toastMsg}</span>
              <button onClick={() => setToastMsg('')} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}