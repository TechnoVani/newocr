// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const PrivateRoute = () => {
  const { token, authReady } = useAuth();
  if (!authReady) return null;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
