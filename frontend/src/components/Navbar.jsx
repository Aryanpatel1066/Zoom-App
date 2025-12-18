import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-md">
      {/* Left side: brand/logo */}
      <Link to="/landing" className="text-2xl font-bold text-blue-400">
        ZoomApp
      </Link>

      {/* Right side: buttons */}
      <div className="flex items-center gap-4">
        {!user ? (
          <>
            <Link
              to="/login"
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 transition"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 transition"
            >
              Signup
            </Link>
          </>
        ) : (
          <>
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 transition"
            >
              <span className="material-icons">account_circle</span>
              {user.firstName}
            </Link>

            <button
              onClick={logout}
              className="px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 transition"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
