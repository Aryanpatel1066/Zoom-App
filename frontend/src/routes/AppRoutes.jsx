 import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/profile" />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route 
      path="/profile" 
      element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } 
    />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
