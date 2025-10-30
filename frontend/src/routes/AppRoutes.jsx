 import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import ProtectedRoute from "../components/ProtectedRoute";
import Landing from "../pages/Landing"
import Room from "../pages/Room"
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
    <Route 
  path="/home" 
  element={
    <ProtectedRoute>
      <Landing />
    </ProtectedRoute>
  } 
/>
<Route 
  path="/room/:roomCode" 
  element={
    <ProtectedRoute>
      <Room />
    </ProtectedRoute>
  }
/>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

export default AppRoutes;
