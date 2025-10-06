 import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <p className="text-center mt-10">Checking session...</p>;

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
