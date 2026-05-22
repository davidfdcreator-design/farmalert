import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { email: payload.email, isAdmin: !!payload.isAdmin, userId: payload.userId };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(!!getToken());
  const [user, setUser] = useState(() => {
    const t = getToken();
    return t ? decodeToken(t) : null;
  });

  useEffect(() => {
    const t = getToken();
    if (t && !user) setUser(decodeToken(t));
  }, [authed]);

  async function login(email, password) {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser({ email: res.email, isAdmin: !!res.isAdmin });
    setAuthed(true);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setAuthed(false);
  }

  return (
    <AuthContext.Provider value={{ authed, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
