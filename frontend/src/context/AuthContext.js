import { createContext, useContext, useState, useEffect } from "react";
import axios from "../api";
import { setStoredToken, getStoredToken } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setReady(true);
      return;
    }
    axios
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setReady(true));
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await axios.post("/auth/login", { email, password });
      setStoredToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.error || "Login failed";
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    setAuthError(null);
    try {
      const res = await axios.post("/auth/register", { name, email, password });
      setStoredToken(res.data.token);
      setUser(res.data.user);
      return { ok: true };
    } catch (err) {
      const message = err.response?.data?.error || "Registration failed";
      setAuthError(message);
      return { ok: false, error: message };
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setAuthError(null);
  };

  const value = {
    isAuthenticated: !!user,
    user,
    login,
    register,
    logout,
    ready,
    authError,
    setAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
