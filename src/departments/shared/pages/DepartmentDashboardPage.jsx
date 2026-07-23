import { Activity, CheckCircle2, Clock3, Database } from "lucide-react";

export default function DepartmentDashboardPage({ data }) {
  const icons = [Activity, CheckCircle2, Clock3, Database];
  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.summary.map((item, index) => {
          const Icon = icons[index] || Activity;
          return (
            <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between"><Icon className="text-blue-600" size={22}/><span className="text-xs font-bold text-emerald-600">{item.trend}</span></div>
              <p className="mt-5 text-3xl font-black text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
            </article>
          );
        })}
      </section>
      <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Recent Insurance Activity</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {data.recentActivity.map((item) => (
            <div key={item.id} className="grid gap-2 py-4 text-sm sm:grid-cols-[1fr_180px_120px]">
              <span className="font-semibold text-slate-800">{item.title}</span><span className="text-slate-500">{item.owner}</span><span className="font-bold text-blue-600">{item.status}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
