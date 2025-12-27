 import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";
import socket from "../socket";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (userData, accessToken) => {
    setUser(userData);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("isLoggedIn", "true");
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

    socket.connect(); // ✅ connect after login
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    finally {
      socket.disconnect(); // ✅ disconnect only here
      localStorage.clear();
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn");

      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get("/auth/refresh");
        const newAccessToken = res.data.accessToken;

        localStorage.setItem("accessToken", newAccessToken);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

        const profileRes = await api.get("/auth/profile");
        setUser(profileRes.data.user);

        socket.connect(); // ✅ connect once auth succeeds
      } catch {
        socket.disconnect();
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
