import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// 1. AÑADIMOS onLoginSuccess COMO PROP
function Login({ onLoginSuccess }) {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2. NUEVO ESTADO PARA EL MENSAJE DE ÉXITO
  const [successMsg, setSuccessMsg] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg(''); // Limpiamos mensajes previos
    setLoading(true);

    try {
      if (isRegistering) {
        await axios.post(`${API_URL}/auth/register`, {
          email: email.trim(),
          password: password,
          full_name: fullName.trim()
        });
        
        setIsRegistering(false);
        setPassword('');
        // Mostrar mensaje en verde en vez de un 'alert' feo
        setSuccessMsg("¡Cuenta creada con éxito! Por favor, inicia sesión.");
        
      } else {
        const formData = new URLSearchParams();
        formData.append('username', email.trim());
        formData.append('password', password);

        const response = await axios.post(`${API_URL}/auth/login`, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        // Ejecutamos el login del contexto (guarda el token)
        login(response.data.access_token);
        
        // 3. MOSTRAMOS FEEDBACK VISUAL Y REDIRIGIMOS
        setSuccessMsg("¡Acceso correcto! Redirigiendo...");
        
        // Damos medio segundo para que el usuario lea el mensaje y luego ejecutamos la redirección
        setTimeout(() => {
            if (onLoginSuccess) {
                onLoginSuccess();
            }
        }, 800);
      }
    } catch (err) {
      console.error('Error de autenticación:', err);
      setError(err.response?.data?.detail || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-gray-900 to-black relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md p-8 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-2xl m-4 relative z-10">
        
        <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
                CeliApp <span className="text-blue-400">🌾</span>
            </h1>
            <p className="text-gray-300 text-sm">
                {isRegistering ? 'Únete a la comunidad sin gluten' : 'Tu asistente personal de alimentos'}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
            <div>
                <label className="text-gray-300 text-xs font-bold uppercase ml-1">Nombre Completo</label>
                <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-800/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-500"
                    placeholder="Ej: Ana García"
                    required={isRegistering}
                />
            </div>
            )}
            
            <div>
                <label className="text-gray-300 text-xs font-bold uppercase ml-1">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-800/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-500"
                    placeholder="tucorreo@ejemplo.com"
                    required
                />
            </div>
            
            <div>
                <label className="text-gray-300 text-xs font-bold uppercase ml-1">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 p-3 bg-gray-800/50 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder-gray-500"
                    placeholder="••••••••"
                    required
                />
            </div>

            {/* 4. SECCIÓN PARA MOSTRAR ERRORES */}
            {error && (
                <div className="bg-red-500/10 text-red-200 p-3 rounded-lg text-sm text-center border border-red-500/20">
                    ⚠️ {error}
                </div>
            )}

            {/* 5. SECCIÓN PARA MOSTRAR ÉXITO */}
            {successMsg && (
                <div className="bg-green-500/20 text-green-200 p-3 rounded-lg text-sm text-center border border-green-500/30">
                    ✅ {successMsg}
                </div>
            )}

            <button 
                type="submit" 
                disabled={loading} 
                className={`w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transform transition-all hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
                {loading ? 'Procesando...' : (isRegistering ? 'Crear Cuenta' : 'Acceder')}
            </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400 text-sm">
                {isRegistering ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
                <button 
                    type="button"
                    className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors"
                    onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); setPassword(''); }}
                >
                {isRegistering ? 'Inicia sesión' : 'Regístrate gratis'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}

export default Login;