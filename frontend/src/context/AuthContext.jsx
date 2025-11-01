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
    api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
   };

  // Logout handler
   const logout = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    console.warn("Logout error (probably already logged out):", err.response?.status);
  } finally {
    localStorage.removeItem("accessToken");
    setUser(null);
  }
};

  
 // So if there’s no accessToken in localStorage, we skip calling /refresh.
useEffect(() => {
  const refreshAccessToken = async () => {
    try {
      const hasToken = localStorage.getItem("accessToken");
      if (!hasToken) {
        setLoading(false);
        return; // no need to call refresh
      }

      const res = await api.get("/auth/refresh");
      const newAccessToken = res.data.accessToken;

      localStorage.setItem("accessToken", newAccessToken);

      const profileRes = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${newAccessToken}` },
      });

      setUser(profileRes.data.user);
    } catch (err) {
      console.warn("Refresh failed:", err.response?.data?.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  refreshAccessToken();
}, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);