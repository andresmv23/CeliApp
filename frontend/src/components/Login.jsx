import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirige al sitio de origen si vine de una ruta protegida
  const from = location.state?.from?.pathname || '/perfil';

  const [modo, setModo]         = useState('login'); // 'login' | 'registro'
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

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
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
            <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.15)' }}>
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

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-xs text-center transition-colors"
          style={{ color: 'rgba(240,253,244,0.25)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,253,244,0.5)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,253,244,0.25)')}
        >
          Volver al buscador
        </button>
      </div>
    </div>
  );
}
