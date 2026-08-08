import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { hasAllDepartmentAccess } from "../config/departmentPortal";
import { DEPARTMENT_DEFINITIONS as DEPARTMENTS } from "../config/departmentDefinitions";
import ReusableSelect from "./reusable/ReusableSelect";

const departmentSlugs = new Set(DEPARTMENTS.map(({ slug }) => slug));
const getSelectedDepartment = pathname => {
  const firstSegment = String(pathname || "").split("/").filter(Boolean)[0];
  return departmentSlugs.has(firstSegment) ? firstSegment : "administration";
};

export default function DepartmentSwitcher({ className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  if (!hasAllDepartmentAccess(user)) return null;

  const selected = getSelectedDepartment(location.pathname);
  const switchDepartment = event => {
    const nextDepartment = event.target.value;
    if (!departmentSlugs.has(nextDepartment) || nextDepartment === selected) return;
    navigate(`/${nextDepartment}`, { replace: true });
  };

  return (
    <label className={`relative block pt-2 ${className}`}>
      <span className="pointer-events-none absolute left-3 top-0 z-10 bg-slate-50 px-1 text-[9px] font-black uppercase leading-none tracking-widest text-slate-500">Department</span>
      <ReusableSelect size="compact" value={selected} onChange={switchDepartment} wrapperClassName="max-w-[210px]" className="bg-slate-50 font-bold">
        {DEPARTMENTS.map(({ slug, label }) => <option key={slug} value={slug}>{label}</option>)}
      </ReusableSelect>
    </label>
  );
}
