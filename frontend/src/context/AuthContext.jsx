import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  //Si hay un token activo guardado intentamos cargar la información del usuario
    useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      
      // Llamada real a /users/me en lugar de un comentario
      const fetchUser = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
          const response = await fetch(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else if (response.status === 401) {
            logout(); // Si el token caducó, forzamos cierre de sesión
          }
        } catch (error) {
          console.error('Error cargando usuario:', error);
        }
      };
      fetchUser();
      
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
  }, [token]);

  const login = (newToken) => {
    setToken(newToken);
  };

  const logout = () => {
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);