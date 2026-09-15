import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import Buscador from './components/Buscador';
import Login from './components/Login';
import Perfil from './components/Perfil';
import SobreCeliApp from './components/SobreCeliApp';
import ComoFunciona from './components/ComoFunciona';
import Privacidad from './components/Privacidad';
import Terminos from './components/Terminos';
import Cookies from './components/Cookies';
import AvisoLegal from './components/AvisoLegal';
import { AuthProvider, useAuth } from './context/AuthContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }, [pathname]);
  return null;
}

function OAuthCallback() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  useEffect(() => { const token = searchParams.get('token'); if (token) { login(token); navigate('/perfil', { replace: true }); } else navigate('/login', { replace: true }); }, [login, navigate, searchParams]);
  return <div className="flex min-h-screen items-center justify-center bg-surface px-4"><div className="flex flex-col items-center gap-4"><div className="h-9 w-9 animate-spin rounded-full border-2 border-accent border-t-transparent" /><p className="text-sm text-[#4B6355]">Iniciando sesión...</p></div></div>;
}

function Logo() {
  return <><svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#16a34a" /><path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" /><line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" /></svg><span className="font-display text-xl font-bold tracking-[-0.01em] text-ink">CeliApp</span></>;
}

function UserIcon({ className = 'h-4 w-4' }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 0-7.5 0zM4.5 20.118a7.5 7.5 0 0115 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.632z" /></svg>;
}

function Navbar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const onScroll = () => setScrolled(window.scrollY > 12); window.addEventListener('scroll', onScroll, { passive: true }); return () => window.removeEventListener('scroll', onScroll); }, []);
  const navLinks = [{ to: '/', label: 'Buscador', end: true }, { to: '/como-funciona', label: 'Cómo funciona', end: true }, { to: '/sobre-celiapp', label: 'Sobre CeliApp', end: true }];
  const navLinkClass = ({ isActive }) => ['relative py-1 text-[0.9375rem] font-medium text-[#4B6355] transition-colors hover:text-ink', 'after:absolute after:-bottom-0.5 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-[width] after:duration-200 hover:after:w-full', isActive ? 'font-semibold text-ink after:w-full' : ''].join(' ');
  const signOut = () => { logout(); navigate('/'); setMenuOpen(false); };
  const profileClass = 'items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3.5 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent/45 hover:bg-accent/10';
  const logoutClass = 'items-center gap-2 rounded-lg border border-ink/15 px-3.5 py-2 text-sm font-medium text-[#4B6355] transition-colors hover:border-red-600/30 hover:bg-red-600/5 hover:text-red-600';
  const loginClass = 'items-center gap-2 rounded-lg bg-accent px-[1.125rem] py-2 text-sm font-semibold tracking-[0.01em] text-white transition-colors hover:bg-green-700';

  return <nav className={['sticky top-0 z-50 w-full border-b backdrop-blur-[14px] transition-[background-color,border-color] duration-300', scrolled ? 'border-ink/10 bg-surface/[0.97]' : 'border-transparent bg-surface/[0.82]'].join(' ')}><div className="mx-auto max-w-[1120px] px-4 sm:px-6"><div className="flex h-16 items-center justify-between gap-4"><NavLink to="/" aria-label="Inicio CeliApp" className="flex shrink-0 items-center gap-2.5 no-underline"><Logo /></NavLink><div className="hidden items-center gap-8 md:flex">{navLinks.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={navLinkClass}>{label}</NavLink>)}</div><div className="flex shrink-0 items-center gap-2 sm:gap-3">{isAuthenticated ? <><NavLink to="/perfil" className={`hidden sm:inline-flex ${profileClass}`}><UserIcon />Mi perfil</NavLink><button onClick={signOut} className={`hidden lg:inline-flex ${logoutClass}`}>Cerrar sesión</button></> : <NavLink to="/login" className={`hidden sm:inline-flex ${loginClass}`}>Iniciar sesión</NavLink>}<button aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMenuOpen((open) => !open)} className="flex rounded-lg p-1.5 text-ink transition-colors hover:bg-ink/5 md:hidden">{menuOpen ? <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="h-[22px] w-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" /></svg>}</button></div></div></div>{menuOpen && <div className="border-t border-ink/10 bg-surface/[0.99] px-4 py-4 pb-5 backdrop-blur-[14px] sm:px-6 md:hidden"><div className="mx-auto max-w-[1120px]">{navLinks.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className="block border-b border-ink/10 py-2.5 text-base font-medium text-ink transition-colors hover:text-accent">{label}</NavLink>)}<div className="mt-4 flex flex-col gap-2">{isAuthenticated ? <><NavLink to="/perfil" onClick={() => setMenuOpen(false)} className={`flex w-full justify-center ${profileClass}`}><UserIcon />Mi perfil</NavLink><button onClick={signOut} className={`flex w-full justify-center ${logoutClass}`}>Cerrar sesión</button></> : <NavLink to="/login" onClick={() => setMenuOpen(false)} className={`flex w-full justify-center ${loginClass}`}>Iniciar sesión</NavLink>}</div></div></div>}</nav>;
}

function ProtectedRoute({ children }) { const { isAuthenticated } = useAuth(); return isAuthenticated ? children : <Navigate to="/login" />; }
function MainLayout() { return <div className="min-h-screen w-full overflow-x-hidden bg-surface text-ink"><ScrollToTop /><Navbar /><main className="w-full"><Routes><Route path="/" element={<Buscador />} /><Route path="/como-funciona" element={<ComoFunciona />} /><Route path="/sobre-celiapp" element={<SobreCeliApp />} /><Route path="/privacidad" element={<Privacidad />} /><Route path="/terminos" element={<Terminos />} /><Route path="/cookies" element={<Cookies />} /><Route path="/aviso-legal" element={<AvisoLegal />} /><Route path="/login" element={<Login />} /><Route path="/oauth-callback" element={<OAuthCallback />} /><Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/" />} /></Routes></main></div>; }
export default function App() { return <BrowserRouter><AuthProvider><MainLayout /></AuthProvider></BrowserRouter>; }
