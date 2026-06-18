import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate } from 'react-router-dom';
import Buscador from './components/Buscador';
import Login from './components/Login';
import Perfil from './components/Perfil';
import { AuthProvider, useAuth } from './context/AuthContext';

/* ─── Navbar ──────────────────────────────────────────── */
function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    {
      to: '/',
      label: 'Buscador',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/perfil',
      label: 'Mi Perfil',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

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
          <NavLink
            to="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Ir al inicio"
          >
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md transition-transform group-hover:scale-105">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block" style={{ color: '#f0fdf4' }}>
              CeliApp
            </span>
          </NavLink>

          {/* Menú central */}
          <div
            className="flex space-x-1 p-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {navLinks.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2"
                style={({ isActive }) =>
                  isActive
                    ? { background: 'rgba(255,255,255,0.12)', color: '#f0fdf4' }
                    : { color: 'rgba(240,253,244,0.45)' }
                }
              >
                {icon}
                <span className="hidden sm:block">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* Login / Logout */}
          <div className="shrink-0">
            {isAuthenticated ? (
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                style={{ color: 'rgba(240,253,244,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,253,244,0.4)')}
              >
                <span className="hidden sm:block">Cerrar sesión</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            ) : (
              <NavLink
                to="/login"
                className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                style={{ color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', background: 'rgba(52,211,153,0.08)' }}
              >
                <span className="hidden sm:block">Iniciar sesión</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </NavLink>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

/* ─── Ruta protegida ──────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  // Sin replace: true para que el historial permita volver atrás
  return isAuthenticated ? children : <Navigate to="/login" />;
}

/* ─── Layout principal ────────────────────────────────── */
// Login ahora está DENTRO del layout — tiene Navbar y el botón atrás funciona
function MainLayout() {
  return (
    <div className="min-h-screen w-full relative overflow-x-hidden font-sans" style={{ background: '#070d0a' }}>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 w-full p-0 m-0">
          <Routes>
            <Route path="/" element={<Buscador />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <Perfil />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

/* ─── App root ────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
