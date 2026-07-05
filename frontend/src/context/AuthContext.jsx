import { createContext, useContext, useEffect, useState } from 'react';
import { clearUser, getUser, restoreSession } from '../utils/storage';

const AuthContext = createContext({ user: null, loading: true, refresh: () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession()
      .then((sessionUser) => setUser(sessionUser))
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => setUser(getUser());

  const logout = () => {
    clearUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
