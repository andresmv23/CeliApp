import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }
        await axios.post(`${API_URL}/auth/register`, {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
        });
        setIsRegistering(false);
        setPassword('');
        setSuccessMsg('¡Cuenta creada! Ahora inicia sesión.');
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
        formData.append('password', password);
        const response = await axios.post(`${API_URL}/auth/login`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        login(response.data.access_token);
        setSuccessMsg('¡Acceso correcto! Redirigiendo...');
        setTimeout(() => { if (onLoginSuccess) onLoginSuccess(); }, 700);
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 401) setError('Email o contraseña incorrectos.');
      else if (err.response?.status === 400) setError(detail || 'Datos inválidos. Revisa el formulario.');
      else if (err.response?.status === 422) setError('Email no válido.');
      else setError('Sin conexión con el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegistering(v => !v);
    setError('');
    setSuccessMsg('');
    setPassword('');
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #070d0a 0%, #0b1812 50%, #0e1e15 100%)' }}
    >
      {/* Malla de puntos */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* Glow verde */}
      <div className="absolute pointer-events-none" style={{
        top: '-100px', right: '-80px', width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 60%)',
      }} />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
              C
            </div>
            <span className="font-black text-2xl tracking-tight" style={{ color: '#f0fdf4' }}>
              CeliApp
            </span>
          </div>
          <p className="text-sm" style={{ color: 'rgba(240,253,244,0.45)' }}>
            {isRegistering ? 'Únete a la comunidad sin gluten' : 'Tu asistente personal de alimentos'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Tabs login/registro */}
          <div className="flex rounded-xl p-1 mb-7" style={{ background: 'rgba(0,0,0,0.2)' }}>
            {['Iniciar sesión', 'Registrarse'].map((label, i) => {
              const active = isRegistering === (i === 1);
              return (
                <button key={label} type="button" onClick={switchMode}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={active
                    ? { background: '#10b981', color: '#fff', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }
                    : { color: 'rgba(240,253,244,0.4)' }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nombre — solo en registro */}
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
                  Nombre completo
                </label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Ana García" required={isRegistering}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0fdf4',
                  }}
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com" required autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#f0fdf4',
                }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'rgba(240,253,244,0.5)' }}>
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={isRegistering ? 'Mínimo 6 caracteres' : '••••••••'}
                  required autoComplete={isRegistering ? 'new-password' : 'current-password'}
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm font-medium focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#f0fdf4',
                  }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity"
                  style={{ color: 'rgba(240,253,244,0.3)' }}
                >
                  {showPass
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Feedback */}
            {error && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                {error}
              </div>
            )}
            {successMsg && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.2)' }}>
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {successMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ background: '#10b981' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Procesando…
                </>
              ) : isRegistering ? 'Crear cuenta gratis' : 'Acceder'}
            </button>
          </form>

          {/* Link alternar */}
          <p className="mt-6 text-center text-sm" style={{ color: 'rgba(240,253,244,0.35)' }}>
            {isRegistering ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button type="button" onClick={switchMode}
              className="font-bold transition-colors"
              style={{ color: '#34d399' }}>
              {isRegistering ? 'Inicia sesión' : 'Regístrate gratis'}
            </button>
          </p>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-xs flex items-center gap-1.5 mx-auto transition-colors"
            style={{ color: 'rgba(240,253,244,0.25)' }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/>
            </svg>
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
