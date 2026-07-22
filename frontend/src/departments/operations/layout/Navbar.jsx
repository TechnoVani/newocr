import { useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BarChart3, ChevronDown, FilePlus2, LayoutDashboard, Menu, RefreshCw, Settings2, UserPlus, X } from "lucide-react";
import logo from "../../../assets/logo.png";
import DepartmentSwitcher from "../../../components/DepartmentSwitcher";
import ProfileMenu from "../../../components/ProfileMenu";

const navItems = [
  { name: "Dashboard", path: "/operations", icon: LayoutDashboard },
  { name: "Renewals", path: "/operations/renewals", icon: RefreshCw },
  { name: "Reports", path: "/operations/report-entry", icon: BarChart3 },
  { name: "Add Reference", path: "/operations/add-ref", icon: UserPlus },
  { name: "Set Comm", path: "/operations/set-comm", icon: Settings2 },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const policyEntryActive = location.pathname.startsWith("/operations/motor-entry");
  
  // Ref for the dropdown timeout
  const dropdownTimeoutRef = useRef(null);
  
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
        <NavLink to="/operations" className="flex shrink-0 items-center" aria-label="Operations dashboard">
          <img src={logo} alt="Logo" className="h-12 md:h-14 w-auto object-contain" />
        </NavLink>

        <DepartmentSwitcher className="hidden lg:flex" />

        {/* Navigation Tabs - Font size increased to text-base */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/operations"}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-base font-semibold transition-all duration-200 ${
                  isActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:text-[#1E88E5]"
                }`
              }
            >
              <Icon size={17} aria-hidden="true" />
              <span>{item.name}</span>
            </NavLink>
            );
          })}

          {/* Policy Entry Dropdown - FIXED */}
          <div
            className="relative"
            onMouseEnter={handleDropdownMouseEnter}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <button
              type="button"
              className={`flex items-center gap-1 rounded-lg px-4 py-2 text-base font-semibold transition-all duration-200 ${policyEntryActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:text-[#1E88E5]"}`}
            >
              <FilePlus2 size={17} aria-hidden="true" />
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
                  to="/operations/motor-entry"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // optional: close mobile menu if open
                    setIsOpen(false);
                  }}
                  className="block px-4 py-2 text-base font-semibold text-gray-600 hover:text-[#1E88E5] hover:bg-gray-50"
                >
                  <span className="flex items-center gap-2"><FilePlus2 size={17} aria-hidden="true" /> Motor Entry</span>
                </NavLink>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Profile + Mobile Toggle */}
        <div className="flex items-center gap-4">
          <ProfileMenu profilePath="/operations/profile" />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle Operations navigation"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Font size increased */}
      {isOpen && (
        <div className="lg:hidden absolute w-full bg-white border-b border-gray-200 px-4 py-4 shadow-lg z-40">
          <DepartmentSwitcher className="mb-3 border-b border-slate-100 pb-3" />
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.path === "/operations"}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg p-3 text-base font-semibold ${isActive ? "bg-[#1E88E5] text-white" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"}`}
              >
                <Icon size={18} aria-hidden="true" />
                <span>{item.name}</span>
              </NavLink>
              );
            })}
            <div className="border-t border-gray-100 pt-2">
              <NavLink
                to="/operations/motor-entry"
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg p-3 text-base font-semibold ${isActive ? "bg-[#1E88E5] text-white" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"}`}
              >
                <FilePlus2 size={18} aria-hidden="true" />
                <span>Motor Entry</span>
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
