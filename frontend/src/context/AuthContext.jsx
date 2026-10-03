import { createContext, useContext, useState, useEffect } from "react";
import api, { setAccessToken as setApiAccessToken, registerTokenRefreshHandler } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAccessToken = (token) => {
    setAccessTokenState(token);
    setApiAccessToken(token);
  };

  useEffect(() => {
    registerTokenRefreshHandler((newToken) => setAccessTokenState(newToken));

    const tryRefresh = async () => {
      try {
        const res = await api.post("/api/auth/refresh");
        setAccessToken(res.data.accessToken);
        const meRes = await api.get("/api/auth/me");
        setUser(meRes.data.user);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = (token, userData) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}