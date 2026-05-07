import { useState, useEffect } from 'react';
import Buscador from './components/Buscador';
import Login from './components/Login';
import Perfil from './components/Perfil';
import { AuthProvider, useAuth } from './context/AuthContext';

/* ─── Navbar ──────────────────────────────────────────── */
function Navbar({ setVista, vistaActual }) {
  const { logout, isAuthenticated } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(7,13,10,0.95)' : 'rgba(7,13,10,0.80)',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <button
            onClick={() => setVista('buscador')}
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Ir al inicio"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-105">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block" style={{ color: '#f0fdf4' }}>
              CeliApp
            </span>
          </button>

          {/* Menú central */}
          <div
            className="flex space-x-1 p-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {[
              {
                id: 'buscador', label: 'Buscador',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
              },
              {
                id: 'perfil', label: 'Mi Perfil',
                icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
              },
            ].map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setVista(id)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={vistaActual === id
                  ? { background: 'rgba(255,255,255,0.12)', color: '#f0fdf4' }
                  : { color: 'rgba(240,253,244,0.45)' }
                }
                aria-current={vistaActual === id ? 'page' : undefined}
              >
                {icon}
                <span className="hidden sm:block">{label}</span>
              </button>
            ))}
          </div>

          {/* Login / Logout */}
          <div className="shrink-0">
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); setVista('buscador'); }}
                className="text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ color: 'rgba(240,253,244,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,253,244,0.4)'}
              >
                <span className="hidden sm:block">Cerrar sesión</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setVista('login')}
                className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{
                  color: '#34d399',
                  border: '1px solid rgba(52,211,153,0.3)',
                  background: 'rgba(52,211,153,0.08)',
                }}
              >
                <span className="hidden sm:block">Iniciar sesión</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                </svg>
              </button>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

/* ─── Layout principal ────────────────────────────────── */
function MainLayout({ vista, setVista }) {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden font-sans" style={{ background: '#070d0a' }}>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar setVista={setVista} vistaActual={vista} />
        <main className="flex-1 w-full p-0 m-0">
          {vista === 'buscador' ? <Buscador /> : <Perfil setVista={setVista} />}
        </main>
      </div>
    </div>
  );
}

/* ─── Router ──────────────────────────────────────────── */
function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [vista, setVista] = useState('buscador');

  // Redirige al login si intenta ir a perfil sin auth
  useEffect(() => {
    if (vista === 'perfil' && !isAuthenticated) {
      setVista('login');
    }
  }, [vista, isAuthenticated]);

  if (vista === 'login') {
    return (
      <div className="h-screen w-screen">
        <Login onLoginSuccess={() => setVista('perfil')} />
      </div>
    );
  }

  return <MainLayout vista={vista} setVista={setVista} />;
}

/* ─── App root ────────────────────────────────────────── */
export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}