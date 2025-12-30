import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { errorToast, successToast } from "../utils/toast";
import { User, Mail, LogOut } from "lucide-react";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData(res.data.user);
    } catch {
      errorToast("Failed to load profile");
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      successToast("Logged out successfully");
      navigate("/login");
    } catch {
      errorToast("Logout failed");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] to-[#eef2ff] px-4">
      {userData ? (
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="text-blue-600" size={36} />
          </div>

          <h2 className="text-2xl font-bold mb-1">{userData.firstName}</h2>

          <div className="flex items-center justify-center gap-2 text-gray-500 mb-6">
            <Mail size={16} />
            {userData.email}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl
              bg-red-500 hover:bg-red-600 text-white transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      ) : (
        <p>Loading profile...</p>
      )}
    </div>
  );
}
