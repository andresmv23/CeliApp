import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const styles = `
  .login-card {
    width: 100%;
    max-width: 420px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1.25rem;
    padding: 2.5rem 2rem;
    box-shadow: 0 4px 24px rgba(13,31,20,0.07), 0 1px 4px rgba(13,31,20,0.05);
  }

  .login-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    color: var(--color-text);
    background: var(--color-bg);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    outline: none;
    transition: border-color var(--transition), box-shadow var(--transition);
  }
  .login-input::placeholder { color: var(--color-text-muted); opacity: 0.55; }
  .login-input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
  }

  .login-tab {
    flex: 1;
    padding: 0.5rem 0;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 600;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: background var(--transition), color var(--transition);
  }
  .login-tab-active {
    background: var(--color-surface);
    color: var(--color-text);
    box-shadow: 0 1px 4px rgba(13,31,20,0.08);
  }
  .login-tab-inactive {
    background: transparent;
    color: var(--color-text-muted);
  }

  .login-btn-google {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
    padding: 0.75rem 1rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text);
    background: var(--color-surface);
    border: 1.5px solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition), border-color var(--transition), box-shadow var(--transition);
  }
  .login-btn-google:hover {
    background: var(--color-bg);
    border-color: rgba(13,31,20,0.18);
    box-shadow: 0 2px 8px rgba(13,31,20,0.06);
  }

  .login-btn-submit {
    width: 100%;
    padding: 0.8125rem 1rem;
    font-family: var(--font-body);
    font-size: 0.9375rem;
    font-weight: 700;
    color: #fff;
    background: var(--color-primary);
    border: none;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background var(--transition), transform var(--transition), box-shadow var(--transition);
    box-shadow: 0 1px 3px rgba(13,31,20,0.12);
    letter-spacing: 0.01em;
  }
  .login-btn-submit:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(22,163,74,0.22);
  }
  .login-btn-submit:active:not(:disabled) { transform: translateY(0); }
  .login-btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  .login-error {
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    background: rgba(220,38,38,0.06);
    color: #dc2626;
    border: 1px solid rgba(220,38,38,0.15);
  }
  .login-success {
    font-size: 0.875rem;
    padding: 0.75rem 1rem;
    border-radius: var(--radius-md);
    background: rgba(22,163,74,0.07);
    color: var(--color-primary-hover);
    border: 1px solid rgba(22,163,74,0.18);
  }

  .login-label {
    display: block;
    font-family: var(--font-body);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.375rem;
    letter-spacing: 0.01em;
  }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    margin: 1.25rem 0;
  }
  .login-divider-line {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }
  .login-divider-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    opacity: 0.7;
    white-space: nowrap;
  }
`;

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
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: 'calc(100vh - 4rem)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.25rem',
        background: 'var(--color-bg)',
      }}>
        <div className="login-card">

          {/* ── Logo + título ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
            <a href="/" aria-label="Volver al inicio" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginBottom: '1.5rem' }}>
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="9" fill="#16a34a" />
                <path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" />
                <ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" />
                <ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" />
                <line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
              </svg>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                CeliApp
              </span>
            </a>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '-0.02em', textAlign: 'center' }}>
              {modo === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-muted)', marginTop: '0.375rem', textAlign: 'center' }}>
              {modo === 'login' ? 'Accede a tu perfil y favoritos' : 'Empieza a usar CeliApp gratis'}
            </p>
          </div>

          {/* ── Botón Google ── */}
          <button className="login-btn-google" onClick={handleGoogle}>
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          {/* ── Separador ── */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">o usa tu email</span>
            <div className="login-divider-line" />
          </div>

          {/* ── Tabs login / registro ── */}
          <div style={{
            display: 'flex',
            padding: '0.25rem',
            borderRadius: '0.625rem',
            background: 'var(--color-bg)',
            border: '1.5px solid var(--color-border)',
            marginBottom: '1.5rem',
          }}>
            {[{ id: 'login', label: 'Iniciar sesión' }, { id: 'registro', label: 'Registrarse' }].map(t => (
              <button
                key={t.id}
                onClick={() => { setModo(t.id); setError(''); setSuccess(''); }}
                className={`login-tab ${modo === t.id ? 'login-tab-active' : 'login-tab-inactive'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Formulario ── */}
          <form onSubmit={modo === 'login' ? handleLogin : handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {modo === 'registro' && (
              <div>
                <label className="login-label">Nombre completo</label>
                <input
                  className="login-input"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            <div>
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label className="login-label">Contraseña</label>
              <input
                className="login-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>

            {error   && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            <button
              type="submit"
              className="login-btn-submit"
              disabled={loading}
              style={{ marginTop: '0.25rem' }}
            >
              {loading
                ? 'Cargando...'
                : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

        </div>
      </div>
    </>
  );
}
