 import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* LOGO */}
        <Link to="/landing" className="text-xl font-bold text-blue-600">
          Zoom<span className="text-gray-900">App</span>
        </Link>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="
                  px-5 py-2 text-sm font-medium rounded-full
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-700 hover:to-indigo-700
                  text-white shadow-md transition
                "
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/profile"
                className="
                  flex items-center gap-2 px-4 py-2 rounded-full
                  bg-blue-50 text-blue-600 hover:bg-blue-100
                  transition
                "
              >
                <User size={18} />
                <span className="text-sm font-medium">
                  {user.firstName}
                </span>
              </Link>

              <button
                onClick={logout}
                className="
                  px-4 py-2 rounded-full text-sm font-medium
                  text-red-600 bg-red-50 hover:bg-red-100
                  transition
                "
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
