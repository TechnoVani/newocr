import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { hasMinimumRole } from "../config/roleAccess";

export default function MinimumRoleRoute({ role, fallback = "/" }) {
  const { user } = useAuth();
  const location = useLocation();
  return hasMinimumRole(user, role)
    ? <Outlet />
    : <Navigate to={fallback} replace state={{ deniedFrom: location.pathname }} />;
}
