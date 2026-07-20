// src/App.jsx
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import useAuth from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import MotorEntry from "./pages/MotorEntry";
import Navbar from "./pages/Navbar";
import AddReference from "./pages/Refrence";
import SetCount from "./pages/SetCount";
import Renewals from "./pages/Renewals";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import PrivateRoute from "./components/PrivateRoute";
import Profile from "./pages/Profile";
import ReportEntry from "./pages/ReportEntry";
import ResetPassword from "./pages/ResetPassword";
import Footer from "./components/Footer";

function App() {
  const location = useLocation();
  const { token } = useAuth();
  
  // UPDATE: Hide the navbar on BOTH the login and forgot-password pages
  const hideNavbar = ["/login", "/forgot-password", "/reset-password"].includes(location.pathname);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50/50">
      
      {/* Navbar will NOT render on Login or Forgot Password */}
      {!hideNavbar && <Navbar />}
      
      <main className="flex min-h-0 w-full flex-1 flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        
          <Route
            path="/"
            element={
              token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            }
          />
        
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/motor-entry" element={<MotorEntry />} />
            <Route path="/add-ref" element={<AddReference />} />
            <Route path="/renewals" element={<Renewals />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/set-comm" element={<SetCount />} />
            <Route path="/report-entry" element={<ReportEntry />} />
          </Route>
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
