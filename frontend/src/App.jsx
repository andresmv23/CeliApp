import { useState } from 'react'
import Buscador from './components/Buscador'
import Login from './components/Login'
import Perfil from './components/Perfil'
import { AuthProvider, useAuth } from './context/AuthContext'

const Navbar = ({ setVista, vistaActual }) => {
    const { logout, isAuthenticated } = useAuth();
    
    return (
        <nav className="sticky top-0 z-50 w-full backdrop-blur-md transition-all"
          style={{
            background: 'rgba(7, 13, 10, 0.80)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* Logo */}
                    <div
                      className="flex-shrink-0 flex items-center gap-2 cursor-pointer"
                      onClick={() => setVista('buscador')}
                    >
                        <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center text-white font-bold shadow-md text-sm">
                            C
                        </div>
                        <span className="font-extrabold text-xl tracking-tight hidden sm:block"
                          style={{ color: '#f0fdf4' }}>
                            CeliApp
                        </span>
                    </div>

                    {/* Menú Central */}
                    <div className="flex space-x-1 p-1 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                        <button
                            onClick={() => setVista('buscador')}
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                            style={vistaActual === 'buscador'
                              ? { background: 'rgba(255,255,255,0.12)', color: '#f0fdf4' }
                              : { color: 'rgba(240,253,244,0.45)' }
                            }
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="hidden sm:block">Buscador</span>
                            </span>
                        </button>
                        <button
                            onClick={() => setVista('perfil')}
                            className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                            style={vistaActual === 'perfil'
                              ? { background: 'rgba(255,255,255,0.12)', color: '#f0fdf4' }
                              : { color: 'rgba(240,253,244,0.45)' }
                            }
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="hidden sm:block">Mi Perfil</span>
                            </span>
                        </button>
                    </div>

                    {/* Botón dinámico Login/Logout */}
                    <div className="flex-shrink-0">
                        {isAuthenticated ? (
                            <button
                                onClick={() => { logout(); setVista('buscador'); }}
                                className="text-sm font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                                style={{ color: 'rgba(240,253,244,0.4)' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(240,253,244,0.4)'}
                            >
                                <span className="hidden sm:block">Cerrar sesión</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={() => setVista('login')}
                                className="text-sm font-semibold flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                                style={{
                                  color: '#34d399',
                                  border: '1px solid rgba(52,211,153,0.3)',
                                  background: 'rgba(52,211,153,0.08)',
                                }}
                            >
                                <span className="hidden sm:block">Iniciar Sesión</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    );
};

// 4. NUEVO MAINLAYOUT LIMPIO QUE ENVOLVERÁ SÓLO BUSCADOR O PERFIL
function MainLayout({ vista, setVista }) {
    return (
        // Cambia bg-slate-50 por el color oscuro del Hero
        <div className="min-h-screen w-full relative overflow-x-hidden font-sans"
             style={{ background: '#070d0a' }}> {/* ← ESTE CAMBIO */}
            
            {/* Quita los blobs de fondo, ya no encajan con el nuevo diseño oscuro */}

            <div className="relative z-10 flex flex-col min-h-screen">
                <Navbar setVista={setVista} vistaActual={vista} />
                
                <main className="flex-1 w-full p-0 m-0"> {/* ← SIN padding aquí */}
                    {vista === 'buscador' ? <Buscador /> : <Perfil />}
                </main>
            </div>
        </div>
    )
}

// 5. COMPONENTE APP: AQUÍ SE DECIDE SI PINTAR LA APP ENTERA O SÓLO EL LOGIN COMPLETO
function AppRouter() {
    const { isAuthenticated } = useAuth();
    const [vista, setVista] = useState('buscador'); 

    // Si el usuario clica en Perfil pero no está logueado, lo forzamos al login
    if (vista === 'perfil' && !isAuthenticated) {
        setVista('login');
    }

    // Si la vista es login, renderizamos el componente Login a PANTALLA COMPLETA
    if (vista === 'login') {
        return (
            <div className="h-screen w-screen m-0 p-0 absolute inset-0 overflow-hidden">
                 <Login onLoginSuccess={() => setVista('perfil')} />
            </div>
        );
    }

    // Si no es login, mostramos la estructura normal de la app (Navbar + Blobs + Contenido)
    return <MainLayout vista={vista} setVista={setVista} />;
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App