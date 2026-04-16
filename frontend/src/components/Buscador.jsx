import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// import Scanner from './Scanner'; // Descomenta esto cuando lo necesites

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Buscador() {
  const { token } = useAuth();
  
  // ESTADOS RESTAURADOS
  const [ean, setEan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleScan = (codigoEscaneado) => {
    setEan(codigoEscaneado);
    setMostrarScanner(false);
  };

  // LÓGICA DE BÚSQUEDA REAL
  const buscarProducto = async (e) => {
    e.preventDefault();
    if (!ean.trim()) return;

    setLoading(true);
    setError(null);
    setResultado(null);
    setEsFavorito(false);

    try {
      // Configuramos los headers dinámicamente. Si hay token, lo mandamos. Si no, va vacío.
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await axios.get(`${API_URL}/producto/${ean}`, { headers });
      setResultado(response.data);
      
    } catch (err) {
      if (err.response?.status === 401) {
          setError('Sesión caducada. Por favor, sal y vuelve a entrar.');
      } else if (err.response?.status === 404) {
          setError('Producto no encontrado. Revisa el código EAN.');
      } else if (err.response?.status === 429) {
          setError('Has alcanzado el límite de búsquedas. Espera un minuto.');
      } else {
          setError('Error de conexión con el servidor.');
      }
      console.error('Error buscando producto:', err);
    } finally {
      setLoading(false);
    }
  };

  // LÓGICA DE FAVORITOS
  const toggleFavorito = async () => {
    if (!resultado) return;
    if (!token) {
      setToastMsg("Debes iniciar sesión para guardar favoritos");
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    
    try {
      if (esFavorito) {
        setToastMsg("Ya está en favoritos");
        setTimeout(() => setToastMsg(''), 3000);
        return;
      }
      
      await axios.post(`${API_URL}/favoritos`, 
        { ean: ean }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEsFavorito(true);
      setToastMsg("❤️ ¡Añadido a tus favoritos!");
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      console.error('Error al guardar favorito:', err);
      setToastMsg("Error gestionando favoritos");
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  // LÓGICA DE ESTILOS VISUALES RESTAURADA
  const getStatusStyles = (analisis) => {
    // Protección en caso de que el análisis falle
    if (!analisis) return { borderColor: 'border-gray-500', bgHeader: 'bg-gray-50', textColor: 'text-gray-800', icon: '❓ DESCONOCIDO', titleColor: 'text-gray-700' };
    
    return analisis.es_apto 
      ? { borderColor: 'border-green-500', bgHeader: 'bg-green-50', textColor: 'text-green-800', icon: '✅ APTO', titleColor: 'text-green-700' }
      : { borderColor: 'border-red-500', bgHeader: 'bg-red-50', textColor: 'text-red-800', icon: '🚫 NO APTO', titleColor: 'text-red-700' };
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8">
      
      {/* Sección Hero / Contexto (Se oculta cuando hay un resultado para centrar la atención) */}
      {!resultado && (
          <div className="text-center w-full max-w-3xl mb-12 animate-fade-in">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold tracking-wide mb-4 border border-blue-100">
              Versión Beta 1.0
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Tu aliado contra el <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Gluten</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto">
              Escanea o introduce el código de barras de cualquier producto. Nuestra inteligencia artificial analizará los ingredientes en segundos para decirte si es seguro para tu dieta.
            </p>
          </div>
      )}

      {/* Tarjeta Principal del Buscador */}
      <div className={`w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 sm:p-4 transition-all hover:shadow-2xl ${resultado ? 'mb-8' : ''}`}>
        <form onSubmit={buscarProducto} className="flex flex-col sm:flex-row gap-3">
          
          <div className="relative flex-1 flex items-center">
            {/* Ícono decorativo dentro del input */}
            <div className="absolute left-4 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Ej: 8410100012345" 
              value={ean}
              onChange={(e) => setEan(e.target.value)}
              className="w-full py-4 pl-12 pr-4 rounded-xl border-2 border-transparent bg-gray-50 text-gray-900 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-medium placeholder-gray-400 outline-none"
            />
          </div>
          
          <div className="flex gap-2 sm:w-auto w-full">
            <button 
              type="button" 
              onClick={() => setMostrarScanner(true)}
              className="flex-1 sm:flex-none p-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors flex items-center justify-center border-2 border-transparent hover:border-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-200"
              title="Usar cámara"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <button 
              type="submit" 
              disabled={loading || !ean.trim()} 
              className={`flex-[2] sm:flex-none px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-500/30 text-lg ${loading || !ean.trim() ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analizando...
                </span>
              ) : 'Verificar'}
            </button>
          </div>
        </form>
        
        {/* Mostrar Errores */}
        {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-center rounded-lg border border-red-100 font-medium">{error}</div>}
      </div>

      {/* Renderizado de la tarjeta de Resultados */}
      {resultado && !loading && (
        <div className={`w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border-2 relative transform transition-all animate-fade-in-up ${getStatusStyles(resultado.analisis).borderColor}`}>
            
            <button 
                onClick={toggleFavorito}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10 text-2xl group hover:scale-110"
                title={token ? "Añadir a favoritos" : "Inicia sesión para guardar"}
            >
                <span className="group-hover:scale-125 transition-transform">
                {esFavorito ? '❤️' : '🤍'}
                </span>
            </button>

            <div className={`p-6 border-b border-gray-100 ${getStatusStyles(resultado.analisis).bgHeader}`}>
                <h2 className={`m-0 text-3xl font-black tracking-tight ${getStatusStyles(resultado.analisis).titleColor} flex items-center gap-3`}>
                    {getStatusStyles(resultado.analisis).icon}
                </h2>
                <p className={`mt-3 font-bold text-lg ${getStatusStyles(resultado.analisis).textColor} uppercase tracking-wide opacity-90`}>
                    {resultado.analisis?.motivo || "Análisis no disponible"}
                </p>
            </div>

            <div className="p-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{resultado.producto?.nombre || "Producto sin nombre"}</h2>
                <p className="text-lg text-gray-500 mb-8 font-medium">
                    Marca: <span className="text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{resultado.producto?.marca || "Desconocida"}</span>
                </p>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200/60">
                    <h4 className="flex items-center gap-2 text-gray-700 font-bold mb-3 uppercase text-sm tracking-wider">
                        📝 Ingredientes
                    </h4>
                    <p className="leading-relaxed text-gray-700 text-lg">
                        {resultado.producto?.ingredientes || 'No hay información de ingredientes disponible.'}
                    </p>
                </div>
                
                <div className="mt-4 text-right text-xs text-gray-400">
                    Fuente de datos: {resultado.fuente || "Desconocida"}
                </div>
            </div>
        </div>
      )}

      {/* Indicadores de confianza (Se ocultan si hay resultado) */}
      {!resultado && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl opacity-80">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-xl">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Resultados al instante</h3>
              <p className="text-sm text-gray-500">Conexión directa con la base de datos de OpenFoodFacts.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4 text-xl">🤖</div>
              <h3 className="font-bold text-gray-900 mb-2">IA Especializada</h3>
              <p className="text-sm text-gray-500">Analiza ingredientes ambiguos para evitar falsos positivos.</p>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4 text-xl">📱</div>
              <h3 className="font-bold text-gray-900 mb-2">Historial y Favoritos</h3>
              <p className="text-sm text-gray-500">Guarda tus productos seguros para consultarlos en el supermercado.</p>
            </div>
          </div>
      )}
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in-up z-50">
        <span>{toastMsg}</span>
        <button onClick={() => setToastMsg('')} className="text-gray-400 hover:text-white">✕</button>
        </div>
      )}
    </div>  
  );
}

export default Buscador;