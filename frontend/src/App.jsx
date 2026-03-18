import { useState } from 'react'
import Buscador from './components/Buscador'
import Login from './components/Login'
import Perfil from './components/Perfil'
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Login />;
};

const Navbar = ({ setVista, vistaActual }) => {
    const { logout } = useAuth();
    
    return (
        <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setVista('buscador')}>
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                            C
                        </div>
                        <span className="font-extrabold text-xl tracking-tight text-gray-900 hidden sm:block">
                            CeliApp
                        </span>
                    </div>

                    {/* Menú Central (Píldora interactiva) */}
                    <div className="flex space-x-1 bg-gray-100/80 p-1 rounded-full border border-gray-200/50">
                        <button 
                            onClick={() => setVista('buscador')} 
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                vistaActual === 'buscador' 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span className="hidden sm:block">Buscador</span>
                            </span>
                        </button>
                        <button 
                            onClick={() => setVista('perfil')} 
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                vistaActual === 'perfil' 
                                ? 'bg-white text-blue-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="hidden sm:block">Mi Perfil</span>
                            </span>
                        </button>
                    </div>

                    {/* Botón Salir */}
                    <div className="flex-shrink-0">
                        <button 
                            onClick={logout} 
                            className="text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2"
                        >
                            <span className="hidden sm:block">Cerrar sesión</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}

function MainLayout() {
    const { isAuthenticated } = useAuth();
    const [vista, setVista] = useState('buscador'); 

    return (
        <div className="min-h-screen w-full bg-slate-50 relative overflow-x-hidden font-sans">
            
            {/* Blobs de fondo */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob pointer-events-none"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000 pointer-events-none"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col min-h-screen">
                {/* 1. LA NAVBAR AHORA SIEMPRE ES VISIBLE, esté logueado o no */}
                <Navbar setVista={setVista} vistaActual={vista} isAuthenticated={isAuthenticated} />
                
                <main className="flex-1 flex justify-center py-10 w-full px-4 sm:px-6 lg:px-8">
                    {/* 2. LÓGICA DE RUTAS MEJORADA */}
                    {vista === 'buscador' ? (
                        <Buscador /> // El buscador es libre para todos
                    ) : (
                        <ProtectedRoute>
                            <Perfil /> // El perfil requiere login
                        </ProtectedRoute>
                    )}
                </main>
            </div>
        </div>
    )
}

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}

export default App