// src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axios";

// Inline SVG Icons
const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error("Please enter your registered email");

    try {
      setLoading(true);
      toast.loading("Sending reset instructions...", { id: "reset" });
      
      const response = await axiosInstance.post("/auth/forgot-password", { email: email.trim() });
      toast.success(response.data?.message || "If registered, a reset link has been sent.", { id: "reset" });
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link", { id: "reset" });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Base Page Layout exactly matching Login.jsx
    <div className="flex w-full flex-1 flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-y-auto">
      <Toaster position="top-right" />
      
      <main className="flex-grow flex items-center justify-center w-full px-4 py-6">
        
        {/* Glassmorphism Card */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/40 p-6 sm:p-8 transition-all duration-500 hover:shadow-3xl z-10">
          
          {/* Logo & Subtitle */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src="/logo.png" 
              alt="Notion Insurance Logo" 
              className="w-44 sm:w-52 h-auto object-contain mb-3 drop-shadow-sm" 
            />
            <h2 className="text-xl font-extrabold text-gray-800 text-center tracking-tight mb-1">
              Reset Password
            </h2>
            <p className="text-sm text-gray-500 text-center font-medium tracking-wide px-4">
              Enter your registered email to receive a secure password reset link.
            </p>
          </div>

          {/* Forgot Password Form */}
          <form onSubmit={handleResetPassword} className="space-y-4 sm:space-y-5 mt-4">
            
            {/* Identifier Field */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
                Registered Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <UserIcon />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email"
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/60 focus:bg-white placeholder-gray-400 font-medium"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl py-3.5 text-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none mt-4 tracking-wide"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            
            {/* Back to Login Link */}
            <div className="text-center mt-6 pt-2">
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors focus:outline-none"
              >
                <ArrowLeftIcon />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </main>

    </div>
  );
};

export default ForgotPassword;
