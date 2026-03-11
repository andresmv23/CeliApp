import { useState } from 'react'
import Buscador from './components/Buscador'
import Login from './components/Login'
import Perfil from './components/Perfil'
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Login />;
};

const Navbar = ({ setVista }) => {
    const { logout } = useAuth();
    return (
        <nav className="h-16 bg-white border-b border-gray-200 px-6 flex justify-between items-center shadow-sm w-full">
            <div className="flex gap-6 items-center">
                <h3 
                    className="m-0 text-gray-800 font-bold cursor-pointer hidden md:block" // Oculto nombre en móvil para ahorrar espacio
                    onClick={() => setVista('buscador')}
                >
                    CeliApp 🌾
                </h3>
                <button 
                    onClick={() => setVista('buscador')} 
                    className="bg-transparent border-none cursor-pointer text-base text-gray-600 font-medium hover:text-blue-600 transition-colors"
                >
                    🔍 Buscador
                </button>
                <button 
                    onClick={() => setVista('perfil')} 
                    className="bg-transparent border-none cursor-pointer text-base text-gray-600 font-medium hover:text-blue-600 transition-colors"
                >
                    👤 Mi Perfil
                </button>
            </div>
            
            <button 
                onClick={logout} 
                className="bg-red-500 hover:bg-red-600 text-white border-none py-2 px-4 rounded cursor-pointer transition-colors"
            >
                Salir
            </button>
        </nav>
    )
}

function MainLayout() {
    const { isAuthenticated } = useAuth();
    const [vista, setVista] = useState('buscador'); 

    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col absolute top-0 left-0">
            {isAuthenticated && <Navbar setVista={setVista} />}
            
            <ProtectedRoute>
                 <div className="flex-1 flex justify-center pt-8 w-full px-4">
                    {vista === 'buscador' ? <Buscador /> : <Perfil />}
                 </div>
            </ProtectedRoute>
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