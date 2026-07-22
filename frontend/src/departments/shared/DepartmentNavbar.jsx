import { useState } from "react";
import { BarChart3, ClipboardPlus, Database, Files, LayoutDashboard, Menu, RefreshCw, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import DepartmentSwitcher from "../../components/DepartmentSwitcher";
import ProfileMenu from "../../components/ProfileMenu";
import logo from "../../assets/logo.png";

const items = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "policies", label: "Policies", icon: Files },
  { path: "renewals", label: "Renewals", icon: RefreshCw },
  { path: "reports", label: "Reports", icon: BarChart3 },
  { path: "master", label: "Master", icon: Database },
  { path: "form", label: "Add Entry", icon: ClipboardPlus },
];

export default function DepartmentNavbar({ department }) {
  const [open, setOpen] = useState(false);
  const basePath = `/${department.slug}`;
  const renderItem = ({ path, label, icon: Icon }, mobile = false) => (
    <NavLink
      key={label}
      to={path ? `${basePath}/${path}` : basePath}
      end={!path}
      onClick={() => mobile && setOpen(false)}
      className={({ isActive }) => mobile
        ? `flex items-center gap-3 rounded-lg p-3 text-base font-semibold ${isActive ? "bg-[#1E88E5] text-white" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"}`
        : `flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-base font-semibold transition-all duration-200 ${isActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:text-[#1E88E5]"}`
      }
    >
      <Icon size={mobile ? 18 : 17} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-12">
        <NavLink to={basePath} className="flex shrink-0 items-center">
          <img src={logo} alt="Notion Insurance" className="h-12 w-auto object-contain md:h-14" />
        </NavLink>
        <DepartmentSwitcher className="hidden lg:flex" />
        <nav className="hidden items-center space-x-1 lg:flex" aria-label={`${department.label} navigation`}>
          {items.map((item) => renderItem(item))}
        </nav>
        <div className="flex items-center gap-4">
          <ProfileMenu />
          <button type="button" onClick={() => setOpen((current) => !current)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Toggle navigation">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="absolute z-40 w-full border-b border-gray-200 bg-white px-4 py-4 shadow-lg lg:hidden">
          <DepartmentSwitcher className="mb-3 border-b border-slate-100 pb-3" />
          <nav className="flex flex-col gap-2" aria-label={`${department.label} mobile navigation`}>
            {items.map((item) => renderItem(item, true))}
          </nav>
        </div>
      )}
    </header>
  );
}
