import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// import Scanner from './Scanner'; // Descomenta esto cuando lo necesites

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function Buscador() {
  const { token } = useAuth();
  const [ean, setEan] = useState('');
  const [loading, setLoading] = useState(false);
  // ... (mantén tus otros estados y funciones buscarProducto, etc.)

  const buscarProducto = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulación de carga para que veas el diseño
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[80vh] px-4 sm:px-6 lg:px-8">
      
      {/* Sección Hero / Contexto */}
      <div className="text-center w-full max-w-3xl mb-12">
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

      {/* Tarjeta Principal del Buscador */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 sm:p-4 transition-all hover:shadow-2xl">
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
      </div>

      {/* Indicadores de confianza (Social Proof / Features) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
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

    </div>
  );
}

export default Buscador;