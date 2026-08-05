import { useState } from "react";
import { BarChart3, ChevronDown, ClipboardPlus, Database, Files, LayoutDashboard, Menu, RefreshCw, Settings2, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import DepartmentSwitcher from "../../components/DepartmentSwitcher";
import ProfileMenu from "../../components/ProfileMenu";
import logo from "../../assets/logo.png";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, canAccessSetCommission, hasMinimumRole } from "../../config/roleAccess";
import { getDepartmentMenu } from "../../config/departmentMenus";

const defaultItems = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "policies", label: "Policies", icon: Files },
  { path: "renewals", label: "Renewals", icon: RefreshCw },
  { path: "reports", label: "Reports", icon: BarChart3 },
  { path: "master", label: "Master", icon: Database, minimumRole: ACCESS_ROLES.MANAGER },
  { path: "form", label: "Add Entry", icon: ClipboardPlus },
];

const sharedItems = [
  { path: "/set-comm", label: "Set Commission", icon: Settings2 },
];

export default function DepartmentNavbar({ department, items, dense = false }) {
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState("");
  const { user } = useAuth();
  const location = useLocation();
  const basePath = `/${department.slug}`;
  const allowed = (item) => !item.minimumRole || hasMinimumRole(user, item.minimumRole);
  const configuredItems = [
    ...(items || getDepartmentMenu(department.slug) || defaultItems),
    ...(canAccessSetCommission(user) ? sharedItems : []),
  ];
  const visibleItems = configuredItems
    .filter(allowed)
    .map((item) => item.children ? { ...item, children: item.children.filter(allowed) } : item)
    .filter((item) => !item.children || item.children.length);
  const toPath = (path) => {
    if (!path) return basePath;
    return String(path).startsWith("/") ? path : `${basePath}/${path}`;
  };
  const groupActive = (children = []) => children.some(({ path }) => {
    const target = toPath(path);
    return path ? location.pathname.startsWith(target) : location.pathname === target;
  });
  const renderItem = ({ path, label, icon: Icon }, mobile = false) => (
    <NavLink
      key={label}
      to={toPath(path)}
      end={!path}
      onClick={() => {
        setOpenGroup("");
        if (mobile) setOpen(false);
      }}
      className={({ isActive }) => mobile
        ? `flex items-center gap-3 rounded-lg p-3 text-base font-semibold ${isActive ? "bg-[#1E88E5] text-white" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"}`
        : `flex items-center whitespace-nowrap rounded-lg py-2 font-semibold transition-all duration-200 ${
          dense ? "gap-1.5 px-2.5 text-sm" : "gap-2 px-4 text-base"
        } ${isActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:text-[#1E88E5]"}`
      }
    >
      <Icon size={mobile ? 18 : 17} aria-hidden="true" /><span>{label}</span>
    </NavLink>
  );
  const renderGroup = ({ label, icon: Icon, children }, mobile = false) => {
    const groupKey = `${mobile ? "mobile-" : "desktop-"}${label}`;
    const expanded = openGroup === groupKey;
    const active = groupActive(children);
    if (mobile) {
      return (
        <div key={label}>
          <button type="button" onClick={() => setOpenGroup(expanded ? "" : groupKey)} className={`flex w-full items-center justify-between rounded-lg p-3 text-base font-semibold ${active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]"}`} aria-expanded={expanded}>
            <span className="flex items-center gap-3"><Icon size={18}/>{label}</span>
            <ChevronDown size={16} className={`transition-transform ${expanded ? "rotate-180" : ""}`}/>
          </button>
          {expanded && <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-blue-100 pl-3">
            {children.map((child) => renderItem(child, true))}
          </div>}
        </div>
      );
    }
    return (
      <div key={label} className="relative">
        <button type="button" onClick={() => setOpenGroup(expanded ? "" : groupKey)} className={`flex items-center whitespace-nowrap rounded-lg py-2 font-semibold transition-all ${dense ? "gap-1 px-2 text-sm" : "gap-1.5 px-3 text-base"} ${active ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-[#1E88E5]"}`} aria-expanded={expanded}>
          <Icon size={17}/><span>{label}</span><ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`}/>
        </button>
        {expanded && <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
          {children.map((child) => renderItem(child))}
        </div>}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-12">
        <NavLink to={basePath} className="flex shrink-0 items-center">
          <img src={logo} alt="Notion Insurance" className="h-12 w-auto object-contain md:h-14" />
        </NavLink>
        <DepartmentSwitcher className={dense ? "hidden xl:flex" : "hidden lg:flex"} />
        <nav className={`hidden items-center ${dense ? "gap-0.5 xl:flex" : "space-x-1 lg:flex"}`} aria-label={`${department.label} navigation`}>
          {visibleItems.map((item) => item.children ? renderGroup(item) : renderItem(item))}
        </nav>
        <div className="flex items-center gap-4">
          <ProfileMenu />
          <button type="button" onClick={() => setOpen((current) => !current)} className={`rounded-lg p-2 text-gray-600 hover:bg-gray-100 ${dense ? "xl:hidden" : "lg:hidden"}`} aria-label="Toggle navigation">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {open && (
        <div className={`absolute z-40 w-full border-b border-gray-200 bg-white px-4 py-4 shadow-lg ${dense ? "xl:hidden" : "lg:hidden"}`}>
          <DepartmentSwitcher className="mb-3 border-b border-slate-100 pb-3" />
          <nav className="flex flex-col gap-2" aria-label={`${department.label} mobile navigation`}>
            {visibleItems.map((item) => item.children ? renderGroup(item, true) : renderItem(item, true))}
          </nav>
        </div>
      )}
    </header>
  );
}
