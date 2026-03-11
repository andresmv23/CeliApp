import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Scanner from './Scanner'; 

// URL dinámica: usa localhost en desarrollo y la URL real en producción (Vercel)
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function Buscador() {
  const { token } = useAuth();
  const [ean, setEan] = useState('');
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [esFavorito, setEsFavorito] = useState(false);
  const [mostrarScanner, setMostrarScanner] = useState(false);

  const handleScan = (codigoEscaneado) => {
    setEan(codigoEscaneado);
    setMostrarScanner(false);
  };

  const buscarProducto = async (e) => {
    e.preventDefault();
    if (!ean.trim()) return;

    setLoading(true);
    setError(null);
    setResultado(null);
    setEsFavorito(false);

    try {
      const response = await axios.get(`${API_URL}/producto/${ean}`, {
          headers: { Authorization: `Bearer ${token}` }
      });
      setResultado(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
          setError('Sesión caducada. Por favor, sal y vuelve a entrar.');
      } else if (err.response?.status === 404) {
          setError('Producto no encontrado. Revisa el código EAN.');
      } else {
          setError('Error de conexión con el servidor.');
      }
      console.error('Error buscando producto:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorito = async () => {
      if (!resultado) return;
      
      try {
          if (esFavorito) {
              alert("Ya está en favoritos");
              return;
          } 
          
          await axios.post(`${API_URL}/favoritos`, 
              { ean: ean },
              { headers: { Authorization: `Bearer ${token}` } }
          );
          setEsFavorito(true);
          alert("❤️ ¡Añadido a tus favoritos!");
          
      } catch (err) {
          console.error('Error al guardar favorito:', err);
          alert("Error gestionando favoritos");
      }
  };

  const getStatusStyles = (analisis) => {
    return analisis.es_apto 
      ? { 
          borderColor: 'border-green-500', 
          bgHeader: 'bg-green-50', 
          textColor: 'text-green-800', 
          icon: '✅ APTO', 
          titleColor: 'text-green-700' 
        }
      : { 
          borderColor: 'border-red-500', 
          bgHeader: 'bg-red-50', 
          textColor: 'text-red-800', 
          icon: '🚫 NO APTO', 
          titleColor: 'text-red-700' 
        };
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6">
      
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8 transform transition-all hover:scale-[1.01]">
          <h1 className="text-gray-900 text-center text-3xl font-extrabold mb-8 tracking-tight">
            🔍 Inspector de Alimentos
          </h1>

          <form onSubmit={buscarProducto} className="flex gap-3 items-stretch">
            <button 
                type="button" 
                onClick={() => setMostrarScanner(true)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-2xl flex items-center justify-center border border-gray-200"
                title="Escanear código"
            >
                📷
            </button>

            <div className="relative flex-1 group">
                <input 
                  type="text" 
                  placeholder="Escanea o escribe EAN..." 
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  className="w-full p-4 pl-5 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-lg font-medium placeholder-gray-400 group-hover:border-gray-300"
                />
            </div>
            
            <button 
                type="submit" 
                disabled={loading || !ean.trim()} 
                className={`px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg transform active:scale-95 text-lg ${(loading || !ean.trim()) ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </form>
          
          {error && <div className="mt-4 p-3 bg-red-50 text-red-600 text-center rounded-lg border border-red-100 font-medium">{error}</div>}
      </div>

      {mostrarScanner && (
        <Scanner 
            onScanSuccess={handleScan} 
            onClose={() => setMostrarScanner(false)} 
        />
      )}

      {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <h3 className="text-xl font-semibold animate-pulse">La IA está investigando...</h3>
          </div>
      )}

      {resultado && !loading && (
        <div className={`mt-6 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 relative transform transition-all animate-fade-in-up ${getStatusStyles(resultado.analisis).borderColor}`}>
           
           <button 
                onClick={toggleFavorito}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10 text-2xl group hover:scale-110"
                title="Añadir a favoritos"
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
                   {resultado.analisis.motivo}
               </p>
           </div>

           <div className="p-8">
               <h2 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">{resultado.producto.nombre}</h2>
               <p className="text-lg text-gray-500 mb-8 font-medium">
                   Marca: <span className="text-gray-800 bg-gray-100 px-2 py-1 rounded-md">{resultado.producto.marca}</span>
               </p>

               <div className="bg-gray-50 p-6 rounded-xl border border-gray-200/60">
                   <h4 className="flex items-center gap-2 text-gray-700 font-bold mb-3 uppercase text-sm tracking-wider">
                       📝 Ingredientes
                   </h4>
                   <p className="leading-relaxed text-gray-700 text-lg">
                       {resultado.producto.ingredientes || 'No hay información disponible.'}
                   </p>
               </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default Buscador;