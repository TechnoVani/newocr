import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axios";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let active = true;
    const validate = async () => {
      try {
        await axiosInstance.get("/auth/reset-password/validate", { params: { token } });
        if (active) setValidToken(true);
      } catch {
        if (active) setValidToken(false);
      } finally {
        if (active) setValidating(false);
      }
    };
    validate();
    return () => { active = false; };
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      toast.error("Use at least 8 characters with a letter and number.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosInstance.post("/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });
      setComplete(true);
      toast.success(response.data?.message || "Password reset successfully.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reset password.");
      if (error.response?.status === 400) setValidToken(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <Toaster position="top-right" />
      <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/80 p-7 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Notion Insurance Logo" className="mb-3 w-48 object-contain" />
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <KeyRound size={24} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-800">Create New Password</h1>
          <p className="mt-1 text-sm text-slate-500">Your reset link can be used once and expires after 30 minutes.</p>
        </div>

        {validating ? (
          <div className="py-8 text-center text-sm font-semibold text-slate-500">Checking reset link...</div>
        ) : complete ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Your password has been updated successfully.
            </div>
            <Link to="/login" className="inline-flex w-full justify-center rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700">
              Continue to Login
            </Link>
          </div>
        ) : !validToken ? (
          <div className="space-y-5 text-center">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              This password reset link is invalid or has expired.
            </div>
            <Link to="/forgot-password" className="inline-flex w-full justify-center rounded-2xl bg-blue-600 py-3.5 text-sm font-bold text-white transition hover:bg-blue-700">
              Request New Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-widest text-slate-600">New Password</span>
              <span className="relative block">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3.5 pr-12 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 8 characters"
                  required
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-widest text-slate-600">Confirm Password</span>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3.5 text-sm outline-none transition focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="Enter password again"
                required
              />
            </label>

            <p className="text-xs text-slate-500">Password must contain at least one letter and one number.</p>

            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60">
              {submitting ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
