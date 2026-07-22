import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { BadgeCheck, Building2, ChevronDown, FileText, GitBranch, Home, Menu, ShieldCheck, Users, X } from "lucide-react";
import DepartmentSwitcher from "../../components/DepartmentSwitcher";
import ProfileMenu from "../../components/ProfileMenu";
import logo from "../../assets/logo.png";

const reportLinks = [
  { path: "/accounts/reports/insurer-wise", label: "Insurer Wise", icon: ShieldCheck },
  { path: "/accounts/reports/insured-wise", label: "Insured Wise", icon: Users },
  { path: "/accounts/reports/verify", label: "Verify Report", icon: BadgeCheck },
];

const masterLinks = [
  { path: "/accounts/masters/insurers", label: "Insurer", icon: Building2 },
  { path: "/accounts/masters/insurer-branches", label: "Insurer Branch", icon: GitBranch },
];

const navLinkClass = ({ isActive }) => `flex items-center gap-2 rounded-lg px-4 py-2 text-base font-semibold transition-all duration-200 ${isActive ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-[#1E88E5]"}`;

function DesktopDropdown({ label, icon: Icon, links, active, open, onToggle, onClose }) {
  return (
    <div className="relative">
      <button type="button" onClick={onToggle} className={`flex items-center gap-1 rounded-lg px-4 py-2 text-base font-semibold transition-all duration-200 ${active ? "bg-[#1E88E5] text-white shadow-sm" : "text-gray-600 hover:bg-gray-50 hover:text-[#1E88E5]"}`} aria-expanded={open}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span><ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="absolute left-0 top-full z-50 mt-1 min-w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
        {links.map(({ path, label: itemLabel, icon: ItemIcon }) => <NavLink key={path} to={path} onClick={onClose} className={navLinkClass}><ItemIcon size={17} aria-hidden="true" /><span>{itemLabel}</span></NavLink>)}
      </div>}
    </div>
  );
}

function MobileGroup({ label, icon: Icon, links, open, onToggle, onSelect }) {
  return (
    <div>
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between rounded-lg p-3 text-base font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#1E88E5]" aria-expanded={open}>
        <span className="flex items-center gap-3"><Icon size={18} aria-hidden="true" />{label}</span><ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div className="ml-5 flex flex-col gap-1 border-l border-blue-100 pl-3">
        {links.map(({ path, label: itemLabel, icon: ItemIcon }) => <NavLink key={path} to={path} onClick={onSelect} className={navLinkClass}><ItemIcon size={17} aria-hidden="true" />{itemLabel}</NavLink>)}
      </div>}
    </div>
  );
}

export default function AccountsNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const location = useLocation();
  const toggleDropdown = (name) => setDropdown((current) => current === name ? "" : name);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-12">
        <NavLink to="/accounts" className="flex shrink-0 items-center" aria-label="Accounts dashboard"><img src={logo} alt="Notion Insurance" className="h-12 w-auto object-contain md:h-14" /></NavLink>
        <DepartmentSwitcher className="hidden lg:flex" />
        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/accounts" end className={navLinkClass}><Home size={17} aria-hidden="true" />Dashboard</NavLink>
          <DesktopDropdown label="Reports" icon={FileText} links={reportLinks} active={location.pathname.startsWith("/accounts/reports/")} open={dropdown === "reports"} onToggle={() => toggleDropdown("reports")} onClose={() => setDropdown("")} />
          <DesktopDropdown label="Masters" icon={Building2} links={masterLinks} active={location.pathname.startsWith("/accounts/masters/")} open={dropdown === "masters"} onToggle={() => toggleDropdown("masters")} onClose={() => setDropdown("")} />
        </nav>
        <div className="flex items-center gap-4"><ProfileMenu profilePath="/accounts/profile" /><button type="button" onClick={() => setMobileOpen((value) => !value)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" aria-label="Toggle Accounts navigation" aria-expanded={mobileOpen}>{mobileOpen ? <X size={24} /> : <Menu size={24} />}</button></div>
      </div>
      {mobileOpen && <nav className="absolute z-40 flex w-full flex-col gap-2 border-b border-gray-200 bg-white px-4 py-4 shadow-lg lg:hidden">
        <DepartmentSwitcher className="mb-3 border-b border-slate-100 pb-3" />
        <NavLink to="/accounts" end onClick={() => setMobileOpen(false)} className={navLinkClass}><Home size={18} aria-hidden="true" />Dashboard</NavLink>
        <MobileGroup label="Reports" icon={FileText} links={reportLinks} open={dropdown === "reports"} onToggle={() => toggleDropdown("reports")} onSelect={() => setMobileOpen(false)} />
        <MobileGroup label="Masters" icon={Building2} links={masterLinks} open={dropdown === "masters"} onToggle={() => toggleDropdown("masters")} onSelect={() => setMobileOpen(false)} />
      </nav>}
    </header>
  );
}
