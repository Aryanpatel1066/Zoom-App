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

    socket.connect();
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    finally {
      socket.disconnect();
      localStorage.clear();
      delete api.defaults.headers.common["Authorization"];
      setUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const profileRes = await api.get("/auth/profile");
        setUser(profileRes.data.user);

        socket.connect();
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
