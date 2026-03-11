import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';

function Perfil() {
    const { token } = useAuth();
    const [perfil, setPerfil] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPerfil = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await axios.get(`${API_URL}/users/perfil`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setPerfil(response.data);
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('Error cargando tu perfil. Por favor, intenta de nuevo.');
            } finally {
                setLoading(false);
            }
        };

        fetchPerfil();
    }, [token]);

    const eliminarFavorito = async (ean) => {
        if (!window.confirm("¿Seguro que quieres quitar este producto de favoritos?")) return;
        
        try {
            await axios.delete(`${API_URL}/favoritos/${ean}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPerfil(prev => ({
                ...prev,
                favoritos: prev.favoritos.filter(p => p.ean !== ean)
            }));
        } catch (err) {
            console.error('Error deleting favorite:', err);
            alert("No se pudo eliminar el favorito. Inténtalo de nuevo.");
        }
    };

    const getBadgeStyle = (estado) => {
        const base = "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm";
        switch (estado) {
            case 'APTO': 
                return `${base} bg-green-100 text-green-700 border border-green-200`;
            case 'NO_APTO': 
                return `${base} bg-red-100 text-red-700 border border-red-200`;
            default: 
                return `${base} bg-yellow-100 text-yellow-700 border border-yellow-200`;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    if (error || !perfil) return (
        <div className="text-center mt-12 p-4 bg-red-50 text-red-600 rounded-lg mx-auto max-w-md">
            ⚠️ {error || 'No se pudo cargar la información del usuario'}
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-6 md:p-10">
            
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-10 text-white shadow-lg transform transition-all hover:shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
                            Hola, {perfil.usuario?.full_name || 'Usuario'} 👋
                        </h1>
                        <p className="text-blue-100 text-lg font-medium opacity-90">
                            {perfil.usuario?.email}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-xl border border-white/10">
                        <span className="block text-2xl font-bold text-center">{perfil.favoritos?.length || 0}</span>
                        <span className="text-xs uppercase tracking-wide font-semibold opacity-80">Favoritos</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-red-500 text-xl">❤️</span> Tus Favoritos
                        </h2>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                            {perfil.favoritos?.length || 0}
                        </span>
                    </div>
                    
                    <div className="p-2 flex-1 overflow-y-auto max-h-[500px]">
                        {!perfil.favoritos || perfil.favoritos.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <div className="text-4xl mb-3 opacity-30">🥦</div>
                                <p>Aún no tienes productos favoritos.</p>
                                <p className="text-sm mt-2">¡Escanea algo y dale al corazón!</p>
                            </div>
                        ) : (
                            <ul className="space-y-3 p-2">
                                {perfil.favoritos.map((prod) => (
                                    <li key={prod.ean} className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md hover:border-blue-100 transition-all duration-200 flex justify-between items-start">
                                        <div className="flex-1 pr-4">
                                            <strong className="text-gray-900 text-lg leading-tight block mb-1 group-hover:text-blue-600 transition-colors">
                                                {prod.nombre}
                                            </strong>
                                            <p className="text-sm text-gray-500 mb-3 font-medium">
                                                {prod.marca}
                                            </p>
                                            <span className={getBadgeStyle(prod.estado_gluten)}>
                                                {prod.estado_gluten}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={() => eliminarFavorito(prod.ean)}
                                            className="text-gray-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                                            title="Eliminar de favoritos"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden flex flex-col h-full">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <span className="text-blue-500 text-xl">🕒</span> Historial Reciente
                        </h2>
                    </div>
                    
                    <div className="p-0 flex-1 overflow-y-auto max-h-[500px]">
                        {!perfil.historial || perfil.historial.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <p>Tu historial está vacío.</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {perfil.historial.map((item, index) => (
                                    <li key={index} className="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                        <div className="flex-1">
                                            <strong className="text-gray-800 block mb-1">
                                                {item.nombre}
                                            </strong>
                                            <div className="flex items-center gap-3 text-xs text-gray-400">
                                                <span>📅 {new Date(item.fecha).toLocaleDateString()}</span>
                                                <span>⏰ {new Date(item.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <span className={getBadgeStyle(item.estado_gluten).replace('text-xs', 'text-[10px]')}>
                                                {item.estado_gluten}
                                            </span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Perfil;