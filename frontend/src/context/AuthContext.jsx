import { createContext, useContext, useMemo, useState } from 'react';

const AUTH_STORAGE_KEY = 'video-app-auth';

const AuthContext = createContext(null);

function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(getStoredAuth());

  const value = useMemo(
    () => ({
      token: session?.jwt || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.jwt),
      login: (authResponse) => {
        const next = {
          jwt: authResponse.jwt,
          user: authResponse.user,
        };
        setSession(next);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
      },
      logout: () => {
        setSession(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
