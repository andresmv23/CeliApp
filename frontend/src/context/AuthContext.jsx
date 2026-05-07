import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem('token'));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  }, []);

  const login = useCallback((newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  // Carga los datos del usuario cuando hay token
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);
    fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else if (res.status === 401) {
          // Token caducado — forzar cierre de sesión silencioso
          logout();
        }
      })
      .catch(() => {
        // Sin conexión — mantenemos el token pero no hay datos de usuario
      })
      .finally(() => setLoadingUser(false));
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      loadingUser,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};