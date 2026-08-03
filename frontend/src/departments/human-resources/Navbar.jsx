import { Banknote, BarChart3, Building2, CalendarCheck, CalendarDays, FileBadge, GitBranch, LayoutDashboard, Settings2, Star, UserRoundCog, Users } from "lucide-react";
import DepartmentNavbar from "../shared/DepartmentNavbar";

const hrItems = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { label: "Organization", icon: Building2, children: [
    { path: "employees", label: "Employees", icon: Users },
    { path: "profiles", label: "Employee Profiles", icon: UserRoundCog },
    { path: "organization", label: "Departments & Designations", icon: Building2 },
  ] },
  { path: "documents", label: "Letters", icon: FileBadge },
  { path: "payroll", label: "Payroll", icon: Banknote },
  { path: "attendance", label: "Attendance", icon: CalendarCheck },
  { path: "performance", label: "Performance", icon: Star },
  { path: "reports", label: "HR Reports", icon: BarChart3 },
  { path: "setup", label: "Workforce Setup", icon: Settings2 },
  { label: "Workforce", icon: Users, children: [
    { path: "leave", label: "Leave Management", icon: CalendarDays },
    { path: "lifecycle", label: "Employee Lifecycle", icon: GitBranch },
  ] },
];

export default function HumanResourcesNavbar({ department }) {
  return <DepartmentNavbar department={department} items={hrItems} dense />;
}
