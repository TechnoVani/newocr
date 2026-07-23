import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { canAccessPortal, getDefaultPortalPath } from "../config/departmentPortal";

export default function DepartmentRoute({ portal }) {
  const { user } = useAuth();
  return canAccessPortal(user, portal)
    ? <Outlet />
    : <Navigate to={getDefaultPortalPath(user)} replace />;
}
