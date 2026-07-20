import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import useAuth from "../hooks/useAuth";

// ----- Inline SVG Icons -----
const UserIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// ----- Main Login Component -----
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const [identifier, setIdentifier] = useState(() => localStorage.getItem("rememberedIdentifier") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("rememberedIdentifier")));

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return toast.error("Please enter Email or Mobile Number");
    if (!password) return toast.error("Please enter Password");

    // Determine if identifier is an email or mobile
    const isEmail = identifier.trim().includes("@");
    const payload = {
      personal_email: isEmail ? identifier.trim() : "",
      mobile: isEmail ? "" : identifier.trim(),
      password,
    };

    try {
      setLoading(true);
      toast.loading("Authenticating...", { id: "auth" });
      const auth = await login(payload, rememberMe);
      toast.success(`Welcome back, ${auth.user.name}!`, { id: "auth" });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to login", { id: "auth" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-between bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-y-auto">
      
      {/* Main Content Area */}
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
            <p className="text-sm text-gray-500 text-center font-medium tracking-wide">
              Sign in with your email or mobile number
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            
            {/* Identifier Field */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
                Email or Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <UserIcon />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter email or mobile"
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-2xl pl-11 pr-4 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/60 focus:bg-white placeholder-gray-400 font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-1.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-500">
                  <LockIcon />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-sm text-gray-800 border border-gray-200 rounded-2xl pl-11 pr-16 py-3 sm:py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/60 focus:bg-white placeholder-gray-400 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors text-xs font-bold tracking-wide"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm px-1 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium hover:text-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer transition-all"
                />
                <span className="text-xs sm:text-sm">Remember Me</span>
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-colors text-xs sm:text-sm">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl py-3.5 text-sm shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none mt-4 tracking-wide"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </main>

    </div>
  );
};

export default Login;
