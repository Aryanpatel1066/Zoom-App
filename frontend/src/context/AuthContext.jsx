import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // important: prevent flicker before auth check

  // Login handler
  const login = (userData, accessToken) => {
    setUser(userData);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("isLoggedIn", "true");

    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn(
        "Logout error (probably already logged out):",
        err.response?.status
      );
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("isLoggedIn"); // 👈 ADD
      setUser(null);
    }
  };

  // So if there’s no accessToken in localStorage, we skip calling /refresh.
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
        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;

        const profileRes = await api.get("/auth/profile");
        setUser(profileRes.data.user);
      } catch {
        // 👇 THIS IS NORMAL WHEN NOT LOGGED IN
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
