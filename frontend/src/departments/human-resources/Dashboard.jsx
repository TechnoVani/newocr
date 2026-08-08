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
  return <div className="space-y-4">
    <DashboardHero
      eyebrow="Human Resources department dashboard"
      description="Manage employees, attendance, payroll, performance and workforce activity from one HR workspace."
      actionTo="/human-resources/employees"
      actionLabel="Add Employee"
      actionIcon={UserPlus}
    />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, path, Icon, color, background]) => (
        <div key={label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${background} ${color}`}><Icon size={18}/></div>
            <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">HR</span>
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-0.5 truncate text-xl font-black text-slate-900">{path.includes("net_pay") || path.includes("amount") ? money(get(overview, path)) : get(overview, path)}</p>
        </div>
      ))}
    </div>
    <ReusableTable title="Recent Employee Lifecycle Activity" rows={overview.recentEvents || []} columns={[
      { key: "employee_code", label: "Employee Code" }, { key: "employee_name", label: "Employee" },
      { key: "event_type", label: "Event" }, { key: "event_date", label: "Date" }, { key: "status", label: "Status" },
    ]} emptyMessage="No lifecycle activity yet."/>
  </div>;
}
