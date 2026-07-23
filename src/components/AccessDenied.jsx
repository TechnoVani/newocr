import { LogOut, ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function AccessDenied() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl">
        <ShieldX className="mx-auto mb-4 text-amber-500" size={48} />
        <h1 className="text-2xl font-bold text-slate-900">No portal assigned</h1>
        <p className="mt-3 text-sm text-slate-600">
          {user?.department || "Your department"} is not currently assigned to a portal. Contact a Super Admin.
        </p>
        <button onClick={handleLogout} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </main>
  );
}
