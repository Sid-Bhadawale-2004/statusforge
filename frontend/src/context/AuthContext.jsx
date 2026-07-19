import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check "is there an existing session?"

  // On first load, try to silently restore a session using the refresh cookie
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const res = await api.post("/api/auth/refresh"); // sends the httpOnly cookie automatically
        setAccessToken(res.data.accessToken);
        const meRes = await api.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${res.data.accessToken}` },
        });
        setUser(meRes.data.user);
      } catch (err) {
        // No valid refresh cookie — user simply isn't logged in. Not an error to show.
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

// Custom hook — lets any component just call useAuth() instead of importing AuthContext everywhere
export function useAuth() {
  return useContext(AuthContext);
}