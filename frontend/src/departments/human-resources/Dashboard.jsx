import { Banknote, CalendarCheck, CalendarClock, FileBadge, IndianRupee, Star, UserCheck, UserPlus, Users } from "lucide-react";
import ReusableTable from "../../components/reusable/ReusableTable";
import DashboardHero from "../../components/DashboardHero";

const cards = [
  ["Total Employees", "employees.total", Users, "text-blue-600", "bg-blue-50"],
  ["Active Employees", "employees.active", UserCheck, "text-emerald-600", "bg-emerald-50"],
  ["Pending Leave", "leave.pending", CalendarClock, "text-amber-600", "bg-amber-50"],
  ["Payroll Net", "payroll.net_pay", Banknote, "text-violet-600", "bg-violet-50"],
  ["Issued Letters", "documents.issued", FileBadge, "text-cyan-600", "bg-cyan-50"],
  ["Present This Month", "attendance.present", CalendarCheck, "text-teal-600", "bg-teal-50"],
  ["Payout Total", "payouts.amount", IndianRupee, "text-indigo-600", "bg-indigo-50"],
  ["Average Rating", "performance.average_rating", Star, "text-amber-600", "bg-amber-50"],
];
const get = (source, path) => path.split(".").reduce((value, key) => value?.[key], source) || 0;
const money = value => `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Dashboard({ overview = {} }) {
  return <div className="space-y-6">
    <DashboardHero
      eyebrow="Human Resources department dashboard"
      description="Manage employees, attendance, payroll, performance and workforce activity from one HR workspace."
      actionTo="/human-resources/employees"
      actionLabel="Add Employee"
      actionIcon={UserPlus}
    />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, path, Icon, color, background]) => (
        <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${background} ${color}`}><Icon size={20}/></div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{path.includes("net_pay") || path.includes("amount") ? money(get(overview, path)) : get(overview, path)}</p>
        </div>
      ))}
    </div>
    <ReusableTable title="Recent Employee Lifecycle Activity" rows={overview.recentEvents || []} columns={[
      { key: "employee_code", label: "Employee Code" }, { key: "employee_name", label: "Employee" },
      { key: "event_type", label: "Event" }, { key: "event_date", label: "Date" }, { key: "status", label: "Status" },
    ]} emptyMessage="No lifecycle activity yet."/>
  </div>;
}
