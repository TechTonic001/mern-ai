import axios from 'axios';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

axios.defaults.baseURL = 'http://localhost:5000';

const tokenKey = 'token';
const userKey = 'user';
const AuthContext = createContext(null);

function readStoredUser() {
  const storedUser = localStorage.getItem(userKey);
  return storedUser ? JSON.parse(storedUser) : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(tokenKey));
  const [user, setUser] = useState(() => readStoredUser());

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      return;
    }

    delete axios.defaults.headers.common.Authorization;
  }, [token]);

  const value = useMemo(() => {
    return {
      token,
      user,
      isAuthenticated: Boolean(token),
      login(authResponse) {
        setToken(authResponse.token);
        setUser(authResponse.user);
        localStorage.setItem(tokenKey, authResponse.token);
        localStorage.setItem(userKey, JSON.stringify(authResponse.user));
        axios.defaults.headers.common.Authorization = `Bearer ${authResponse.token}`;
      },
      logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem(tokenKey);
        localStorage.removeItem(userKey);
        delete axios.defaults.headers.common.Authorization;
      },
    };
  }, [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
