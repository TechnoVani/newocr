import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getDefaultPortalPath } from "../config/departmentPortal";

export default function PortalHome() {
  const { user, authReady } = useAuth();
  if (!authReady || !user) return null;
  return <Navigate to={getDefaultPortalPath(user)} replace />;
}
