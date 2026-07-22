import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getDefaultPortalPath } from "../config/departmentPortal";

export default function PortalHome() {
  const { user } = useAuth();
  return <Navigate to={getDefaultPortalPath(user)} replace />;
}
