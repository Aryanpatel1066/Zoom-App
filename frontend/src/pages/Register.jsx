import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";
import { successToast, errorToast } from "../utils/toast";
import { User, Mail, Lock } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/auth/register", formData);
      successToast("Registered successfully! Please login.");
      navigate("/login");
    } catch (err) {
      errorToast(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8f9ff] to-[#eef2ff] px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
      >
        <h2 className="text-3xl font-bold text-center mb-2">
          Create account ✨
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Start your video meetings today
        </p>

        {/* First Name */}
        <div className="mb-4 relative">
          <User className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="firstName"
            placeholder="First name"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4 relative">
          <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4 relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-6 relative">
          <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white font-medium
            bg-gradient-to-r from-green-500 to-emerald-500
            hover:from-green-600 hover:to-emerald-600 transition"
        >
          Register
        </button>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-600 hover:underline cursor-pointer"
          >
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Register;
