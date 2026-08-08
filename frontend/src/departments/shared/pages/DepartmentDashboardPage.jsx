import { Activity, ArrowRight, CheckCircle2, Clock3, Database } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHero from "../../../components/DashboardHero";
import { getDepartmentMenu } from "../../../config/departmentMenus";
import useAuth from "../../../hooks/useAuth";
import { hasMinimumRole } from "../../../config/roleAccess";

export default function DepartmentDashboardPage({ data, department }) {
  const { user } = useAuth();
  const icons = [Activity, CheckCircle2, Clock3, Database];
  const menu = getDepartmentMenu(department.slug);
  const links = menu
    .flatMap((entry) => entry.children || [entry])
    .filter(({ minimumRole }) => !minimumRole || hasMinimumRole(user, minimumRole));
  const createLink = links.find(({ path }) => path === "form");
  const reportLink = links.find(({ path }) => path === "reports");
  const quickLinks = links.filter(({ path }) => path && path !== "reports").slice(0, 4);
  const workGroup = menu.find(({ children }) => children?.some(({ path }) => path === "reports"));
  const portfolioGroup = menu.find(({ children }) => children?.some(({ path }) => path === "policies"));
  const summary = Array.isArray(data?.summary) ? data.summary : [];
  const recentActivity = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const cardStyles = [
    "border-blue-100 bg-blue-50 text-blue-700",
    "border-emerald-100 bg-emerald-50 text-emerald-700",
    "border-amber-100 bg-amber-50 text-amber-700",
    "border-violet-100 bg-violet-50 text-violet-700",
  ];

  return (
    <>
      <DashboardHero
        eyebrow={`${department.label} department dashboard`}
        description={`Manage ${workGroup?.label?.toLowerCase() || "department work"}, monitor ${portfolioGroup?.label?.toLowerCase() || "records"} and keep priority actions on schedule.`}
        actionTo={`/${department.slug}/form`}
        actionLabel={createLink?.label || "Add Entry"}
        actionIcon={createLink?.icon}
      />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item, index) => {
          const Icon = icons[index] || Activity;
          return (
            <article key={item.label} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
              <div className={`absolute inset-y-0 left-0 w-1 ${index === 0 ? "bg-blue-500" : index === 1 ? "bg-emerald-500" : index === 2 ? "bg-amber-500" : "bg-violet-500"}`}/>
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg border ${item.label === "Overdue" && item.value ? "border-red-100 bg-red-50 text-red-700" : cardStyles[index] || cardStyles[0]}`}><Icon size={18}/></span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-400">{item.trend}</span>
              </div>
              <p className="mt-4 text-2xl font-black text-slate-900">{item.value}</p>
              <p className="mt-0.5 text-xs font-bold text-slate-500">{item.label}</p>
            </article>
          );
        })}
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${department.label} quick actions`}>
        {quickLinks.map(({ path, label, icon: Icon }) => (
          <Link key={path} to={`/${department.slug}/${path}`} className="group flex h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/40 hover:shadow-md">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-blue-600 transition group-hover:bg-white"><Icon size={17}/></span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{label}</span>
            <ArrowRight size={16} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-600"/>
          </Link>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{workGroup?.label || department.label}</p>
            <h2 className="mt-0.5 text-base font-black text-slate-900">Recent Department Activity</h2>
          </div>
          {reportLink && <Link to={`/${department.slug}/${reportLink.path}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">View {reportLink.label}<ArrowRight size={15}/></Link>}
        </div>
        <div className="mt-4 divide-y divide-slate-100">
          {recentActivity.map((item) => (
            <div key={item.id} className="grid gap-2 px-4 py-3 text-xs sm:grid-cols-[1fr_160px_90px_110px] sm:px-5">
              <span className="font-semibold text-slate-800">{item.title}{item.policy_number && <small className="ml-2 text-slate-400">{item.policy_number}</small>}</span>
              <span className="text-slate-500">{item.owner}</span>
              <span className="font-bold text-slate-500">{item.priority || "Normal"}</span>
              <span className="font-bold text-blue-600">{item.status}</span>
            </div>
          ))}
          {!recentActivity.length && <p className="px-5 py-12 text-center text-xs font-semibold text-slate-400">No {department.label.toLowerCase()} activity yet.</p>}
        </div>
      </section>
    </>
  );
}
