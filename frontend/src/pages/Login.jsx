import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { successToast, errorToast } from "../utils/toast";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.accessToken);
      successToast("Successfully logged in!");
      navigate("/landing");
    } catch (err) {
      errorToast(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] to-[#eef2ff] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-2">Welcome back 👋</h2>
        <p className="text-center text-gray-500 mb-8">
          Login to continue your meetings
        </p>

        {/* Email */}
        <div className="mb-4 relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="email"
            placeholder="Email address"
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="password"
            placeholder="Password"
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-medium
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-700 hover:to-indigo-700 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 hover:underline cursor-pointer"
          >
            Register here
          </span>
        </p>
      </form>
    </div>
  );
}
