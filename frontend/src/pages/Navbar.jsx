import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, LogOut, Edit } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../redux/actions/authActions";
import axiosInstance from "../config/axios";
import logo from "../assets/logo.png";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Renewals", path: "/renewals" },
  { name: "Reports", path: "/report-entry" },
  { name: "Add Reference", path: "/add-ref" },
  { name: "Set Comm", path: "/set-comm" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const profilePictureObjectUrl = useRef(null);
  const profileMenuRef = useRef(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState("");
  
  // Ref for the dropdown timeout
  const dropdownTimeoutRef = useRef(null);
  
  const userId = user?.id;

  // Detect clicks outside profile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    if (profileMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  // Handle Profile Picture
  useEffect(() => {
    let active = true;
    if (!userId) return undefined;

    axiosInstance.get("/auth/profile/picture", { responseType: "blob" })
      .then((response) => {
        if (!active) return;
        const objectUrl = URL.createObjectURL(response.data);
        if (profilePictureObjectUrl.current) URL.revokeObjectURL(profilePictureObjectUrl.current);
        profilePictureObjectUrl.current = objectUrl;
        setProfilePictureUrl(objectUrl);
      })
      .catch((error) => {
        if (!active || error.response?.status === 404) return;
        console.error("Failed to fetch profile picture:", error);
      });

    return () => {
      active = false;
      if (profilePictureObjectUrl.current) URL.revokeObjectURL(profilePictureObjectUrl.current);
    };
  }, [userId, user?.profile_picture_version]);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  // Handlers for Policy Entry dropdown
  const handleDropdownMouseEnter = () => {
    clearTimeout(dropdownTimeoutRef.current);
    setIsDropdownOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setIsDropdownOpen(false);
    }, 150); // 150ms delay to allow smooth transition to the dropdown
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-12 h-16 flex items-center justify-between">
        
        {/* Logo - Increased height */}
        <div className="flex items-center flex-shrink-0">
          <img src={logo} alt="Logo" className="h-12 md:h-14 w-auto object-contain" />
        </div>

        {/* Navigation Tabs - Font size increased to text-base */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 ${
                  isActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:text-[#1E88E5]"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}

          {/* Policy Entry Dropdown - FIXED */}
          <div
            className="relative"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <button
              className="px-4 py-2 rounded-lg text-base font-semibold flex items-center gap-1 text-gray-600 hover:text-[#1E88E5]"
            >
              <span>Policy Entry</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isDropdownOpen && (
              <div
                className="absolute left-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-2 z-50"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <NavLink
                  to="/motor-entry"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // optional: close mobile menu if open
                    setIsOpen(false);
                  }}
                  className="block px-4 py-2 text-base font-semibold text-gray-600 hover:text-[#1E88E5] hover:bg-gray-50"
                >
                  Motor Entry
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Profile + Mobile Toggle */}
        <div className="flex items-center gap-4">
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-10 h-10 overflow-hidden rounded-full bg-[#1E88E5] text-white flex items-center justify-center font-bold text-sm border border-blue-400 hover:scale-105 transition-transform"
            >
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || "U"
              )}
            </button>
            
            {profileMenuOpen && (
              <div className="absolute right-0 mt-3 w-60 bg-white border border-gray-200 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-2 mb-2 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 truncate">{user?.name}</h4>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">{user?.employee_code}</p>
                </div>
                <button
                  onClick={() => { navigate("/profile"); setProfileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition-all"
                >
                  <Edit size={16} /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Font size increased */}
      {isOpen && (
        <div className="lg:hidden absolute w-full bg-white border-b border-gray-200 px-4 py-4 shadow-lg z-40">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className="block p-3 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"
              >
                {item.name}
              </NavLink>
            ))}
            <div className="border-t border-gray-100 pt-2">
              <NavLink
                to="/motor-entry"
                onClick={() => setIsOpen(false)}
                className="block p-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                Motor Entry
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
