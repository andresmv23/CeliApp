import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/perfil';

  const [modo, setModo]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre]     = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);
      const res = await axios.post(`${API_URL}/auth/login`, params);
      login(res.data.access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        full_name: nombre,
      });
      setSuccess('¡Cuenta creada! Ahora inicia sesión.');
      setModo('login');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  return (
    <div
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #070d0a 0%, #0b1812 50%, #0e1e15 100%)' }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg mb-4">
            C
          </div>
          <h1 className="text-2xl font-black" style={{ color: '#f0fdf4' }}>
            {modo === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(240,253,244,0.4)' }}>
            {modo === 'login' ? 'Accede a tu perfil y favoritos' : 'Empieza a usar CeliApp gratis'}
          </p>
        </div>

        {/* Botón Google */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold mb-5 transition-all"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#f0fdf4',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        {/* Separador */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <span className="text-xs" style={{ color: 'rgba(240,253,244,0.3)' }}>o usa tu email</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Tabs */}
        <div
          className="flex p-1 rounded-2xl mb-6"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {[{ id: 'login', label: 'Iniciar sesión' }, { id: 'registro', label: 'Registrarse' }].map(t => (
            <button
              key={t.id}
              onClick={() => { setModo(t.id); setError(''); setSuccess(''); }}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                modo === t.id
                  ? { background: 'rgba(255,255,255,0.1)', color: '#f0fdf4' }
                  : { color: 'rgba(240,253,244,0.35)' }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={modo === 'login' ? handleLogin : handleRegistro} className="space-y-4">
          {modo === 'registro' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
                Nombre completo
              </label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl text-sm bg-transparent focus:outline-none"
                style={{ color: '#f0fdf4', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl text-sm bg-transparent focus:outline-none"
              style={{ color: '#f0fdf4', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
              Contraseña
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 rounded-xl text-sm bg-transparent focus:outline-none"
              style={{ color: '#f0fdf4', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
              required
            />
          </div>

          {error && (
            <p className="text-sm rounded-xl px-4 py-3"
              style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm rounded-xl px-4 py-3"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}>
              {success}
            </p>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 mt-2"
            style={{ background: '#10b981' }}
          >
            {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
