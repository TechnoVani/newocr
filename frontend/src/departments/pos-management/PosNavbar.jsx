import { BarChart3, CircleDollarSign, FilePlus2, Files, LayoutDashboard, RefreshCw, UserPlus } from "lucide-react";
import DepartmentNavbar from "../shared/DepartmentNavbar";

const items = [
  { path: "", label: "Dashboard", icon: LayoutDashboard },
  { path: "policies", label: "Policies", icon: Files },
  { path: "renewals", label: "Upcoming Policy", icon: RefreshCw },
  { path: "reports", label: "Reports", icon: BarChart3 },
  { path: "payout", label: "Payout", icon: CircleDollarSign },
  { path: "references", label: "References", icon: UserPlus },
  { path: "motor-entry", label: "Motor Entry", icon: FilePlus2 },
];

export default function PosNavbar({ department }) {
  return <DepartmentNavbar department={department} items={items}/>;
}
