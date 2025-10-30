 import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { errorToast, successToast } from "../utils/toast";
import useSocket from "../hooks/useSocket";
export default function Profile() {
  const [userData, setUserData] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data.user);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      successToast("successfully! logout")
      navigate("/login");
    } catch {
      errorToast("Logout failed");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      {userData ? (
        <div className="bg-white p-6 shadow-xl rounded-2xl w-96 text-center">
          <h2 className="text-xl font-semibold mb-2">Welcome, {userData.firstName}</h2>
          <p className="text-gray-600 mb-4">{userData.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
 
    </div>
  );
}
