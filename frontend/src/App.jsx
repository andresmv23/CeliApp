import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import Buscador from './components/Buscador';
import Login from './components/Login';
import Perfil from './components/Perfil';
import { AuthProvider, useAuth } from './context/AuthContext';

/* ─── Estilos globales ────────────────────────────────── */
const globalStyles = `
  :root {
    --font-display: 'Fraunces', Georgia, serif;
    --font-body: 'DM Sans', system-ui, sans-serif;
    --color-bg: #F7FAF8;
    --color-surface: #FFFFFF;
    --color-text: #0D1F14;
    --color-text-muted: #4B6355;
    --color-primary: #16a34a;
    --color-primary-hover: #15803d;
    --color-border: rgba(13, 31, 20, 0.08);
    --radius-md: 0.5rem;
    --radius-full: 9999px;
    --transition: 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
  }

  body {
    font-family: var(--font-body);
    background-color: var(--color-bg);
    color: var(--color-text);
    min-height: 100dvh;
  }

  /* Reveal animation para scroll */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.65s ease, transform 0.65s ease;
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Nav link con underline animado */
  .nav-link {
    position: relative;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--color-text-muted);
    text-decoration: none;
    padding: 0.25rem 0;
    transition: color var(--transition);
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1.5px;
    background: var(--color-primary);
    border-radius: 2px;
    transition: width var(--transition);
  }
  .nav-link:hover {
    color: var(--color-text);
  }
  .nav-link:hover::after,
  .nav-link.active::after {
    width: 100%;
  }
  .nav-link.active {
    color: var(--color-text);
    font-weight: 600;
  }

  /* Botón primario */
  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.125rem;
    background: var(--color-primary);
    color: #fff;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    text-decoration: none;
    transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
    box-shadow: 0 1px 3px rgba(13,31,20,0.12);
    letter-spacing: 0.01em;
  }
  .btn-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22,163,74,0.22);
  }
  .btn-primary:active {
    transform: translateY(0);
  }

  /* Botón ghost (cerrar sesión) */
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    background: transparent;
    color: var(--color-text-muted);
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 500;
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: color var(--transition), border-color var(--transition), background var(--transition);
  }
  .btn-ghost:hover {
    color: #dc2626;
    border-color: rgba(220,38,38,0.28);
    background: rgba(220,38,38,0.04);
  }
`;

/* ─── OAuth Callback ──────────────────────────────────── */
function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/perfil', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '2.25rem', height: '2.25rem',
          border: '2px solid var(--color-primary)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Iniciando sesión...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────────── */
function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { to: '/', label: 'Buscador', end: true },
    { to: '/#como-funciona', label: 'Cómo funciona', end: false },
    { to: '/#sobre-celiapp', label: 'Sobre CeliApp', end: false },
  ];

  return (
    <>
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          width: '100%',
          background: scrolled ? 'rgba(247,250,248,0.97)' : 'rgba(247,250,248,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: scrolled
            ? '1px solid rgba(13,31,20,0.08)'
            : '1px solid transparent',
          transition: 'background 300ms ease, border-color 300ms ease, box-shadow 300ms ease',
          boxShadow: scrolled ? '0 1px 12px rgba(13,31,20,0.05)' : 'none',
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>

            {/* ── Logo ── */}
            <NavLink
              to="/"
              aria-label="Inicio CeliApp"
              style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none', flexShrink: 0 }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="#16a34a" />
                <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
              </svg>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.25rem',
                color: 'var(--color-text)',
                letterSpacing: '-0.01em',
              }}>
                CeliApp
              </span>
            </NavLink>

            {/* ── Links centrales — desktop ── */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}
              className="nav-desktop"
            >
              {navLinks.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  {label}
                </NavLink>
              ))}
            </div>

            {/* ── Acción derecha ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
              {isAuthenticated ? (
                <button
                  className="btn-ghost"
                  onClick={() => { logout(); navigate('/'); }}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Cerrar sesión</span>
                </button>
              ) : (
                <NavLink to="/login" className="btn-primary">
                  Iniciar sesión
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </NavLink>
              )}

              {/* Burger — mobile */}
              <button
                aria-label="Abrir menú"
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  display: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.375rem',
                  color: 'var(--color-text)',
                }}
                className="nav-burger"
              >
                {menuOpen ? (
                  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Menú mobile desplegable ── */}
        {menuOpen && (
          <div style={{
            borderTop: '1px solid var(--color-border)',
            background: 'rgba(247,250,248,0.99)',
            padding: '1rem 1.5rem 1.25rem',
          }}>
            {navLinks.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', padding: '0.625rem 0', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)', textDecoration: 'none', borderBottom: '1px solid var(--color-border)' }}
              >
                {label}
              </NavLink>
            ))}
            <div style={{ marginTop: '1rem' }}>
              {isAuthenticated ? (
                <button
                  className="btn-ghost"
                  onClick={() => { logout(); navigate('/'); setMenuOpen(false); }}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Cerrar sesión
                </button>
              ) : (
                <NavLink
                  to="/login"
                  className="btn-primary"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Iniciar sesión
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Estilos responsive */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-burger  { display: flex !important; }
        }
      `}</style>
    </>
  );
}

/* ─── Ruta protegida ──────────────────────────────────── */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

/* ─── Layout principal ────────────────────────────────── */
function MainLayout() {
  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: '100vh', width: '100%', overflowX: 'hidden', background: 'var(--color-bg)' }}>
        <Navbar />
        <main style={{ flex: 1, width: '100%' }}>
          <Routes>
            <Route path="/" element={<Buscador />} />
            <Route path="/login" element={<Login />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
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
    </>
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
