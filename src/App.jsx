import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./departments/operations/pages/Dashboard";
import MotorEntry from "./departments/operations/pages/MotorEntry";
import AddReference from "./departments/operations/pages/Reference";
import SetComm from "./departments/operations/pages/SetComm";
import Renewals from "./departments/operations/pages/Renewals";
import Profile from "./pages/Profile";
import ReportEntry from "./departments/operations/pages/ReportEntry";
import PrivateRoute from "./components/PrivateRoute";
import DepartmentRoute from "./components/DepartmentRoute";
import PortalHome from "./components/PortalHome";
import PortalShell from "./components/PortalShell";
import AccessDenied from "./components/AccessDenied";
import OperationsLayout from "./departments/operations/layout/OperationsLayout";
import AccountsDashboard from "./departments/accounts/Dashboard";
import { PORTALS } from "./config/departmentPortal";
import { GENERIC_DEPARTMENTS } from "./departments/registry";
import PublicLayout from "./components/PublicLayout";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<PrivateRoute />}>
        <Route element={<PortalShell />}>
          <Route index element={<PortalHome />} />
          <Route path="no-access" element={<AccessDenied />} />
          <Route path="profile" element={<Profile />} />

          <Route element={<DepartmentRoute portal={PORTALS.OPERATIONS} />}>
            <Route path="operations" element={<OperationsLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Navigate to=".." replace />} />
              <Route path="motor-entry" element={<MotorEntry />} />
              <Route path="add-ref" element={<AddReference />} />
              <Route path="renewals" element={<Renewals />} />
              <Route path="profile" element={<Profile />} />
              <Route path="set-comm" element={<SetComm />} />
              <Route path="report-entry" element={<ReportEntry />} />
            </Route>
          </Route>

          <Route element={<DepartmentRoute portal={PORTALS.ACCOUNTS} />}>
            <Route path="accounts/*" element={<AccountsDashboard />} />
          </Route>

          {GENERIC_DEPARTMENTS.map(({ Component, ...department }) => (
            <Route key={department.slug} element={<DepartmentRoute portal={department.slug} />}>
              <Route path={`${department.slug}/*`} element={<Component />} />
            </Route>
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
