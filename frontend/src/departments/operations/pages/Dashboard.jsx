import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CircleDollarSign, Clock3, Files, IndianRupee, RefreshCw, TrendingDown, TrendingUp, Users } from "lucide-react";
import axiosInstance from "../../../config/axios";
import DashboardHero from "../../../components/DashboardHero";


const EMPTY = {
  counts: { total: 0, today: 0, currentMonth: 0, lastMonth: 0 },
  periods: { today: "Today", currentMonth: "Current month", lastMonth: "Last month" },
  premiumTotals: { totalOd: 0, totalTp: 0, netPremium: 0, grossPremium: 0 },
  posBreakdown: [],
  posActivity: { active: 0, notActive: 0, total: 0 },
  recentEntries: [],
  visibility: "self",
};
const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);
const money = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
}).format(Number(value) || 0);
const compactMoney = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
}).format(Number(value) || 0);
const formatDateTime = (value) => {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

export default function Dashboard() {
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    axiosInstance.get("/policies/dashboard/summary")
      .then((response) => { if (active) setSummary(response.data?.data || EMPTY); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load dashboard data.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const retryDashboard = () => {
    setLoading(true);
    setError("");
    setRefreshKey((value) => value + 1);
  };

  const {
    counts = EMPTY.counts,
    periods = EMPTY.periods,
    premiumTotals = EMPTY.premiumTotals,
    posBreakdown = EMPTY.posBreakdown,
    posActivity = EMPTY.posActivity,
    recentEntries = [],
  } = summary;
  const isAllData = summary.visibility === "all";
  const difference = counts.currentMonth - counts.lastMonth;
  const maxMonth = Math.max(counts.currentMonth, counts.lastMonth, 1);
  const cards = [
    { title: "Today's entries", value: counts.today, note: periods.today, Icon: Clock3, color: "bg-blue-50 text-blue-600", line: "bg-blue-500" },
    { title: "All entries", value: counts.total, note: isAllData ? "All employee policies" : "Your saved policies", Icon: Files, color: "bg-violet-50 text-violet-600", line: "bg-violet-500" },
    { title: "Net premium", value: compactMoney(premiumTotals.netPremium), note: "Visible policies", Icon: CircleDollarSign, color: "bg-emerald-50 text-emerald-600", line: "bg-emerald-500", premium: true },
    { title: "Gross premium", value: compactMoney(premiumTotals.grossPremium), note: "Total payable", Icon: IndianRupee, color: "bg-amber-50 text-amber-600", line: "bg-amber-500", premium: true },
    {
      title: "Current month POS",
      value: `${formatNumber(posActivity.active)} / ${formatNumber(posActivity.notActive)}`,
      note: "Active / Not active",
      Icon: Users,
      color: "bg-cyan-50 text-cyan-600",
      line: "bg-cyan-500",
      premium: true,
    },
  ];

  return (
    <main className="relative flex-1 bg-slate-50/50 px-3 py-4 sm:px-5 lg:px-8 overflow-hidden">
      {/* Decorative Radial Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none" />
      
      <div className="relative mx-auto max-w-[1480px]">
        <DashboardHero
          description={isAllData ? "Viewing policy activity for all employees." : "Track your entries and keep today's work moving."}
          actionTo="/operations/motor-entry"
          actionLabel="New Motor Entry"
        />

        {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700" role="alert">
          <span>{error}</span><button onClick={retryDashboard} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={15} /> Retry</button>
        </div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Entry totals">
          {cards.map(({ title, value, note, Icon, color, line, premium }) => (
            <article 
              key={title} 
              className="relative group overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-300/60 hover:-translate-y-1"
            >
              {/* Top border glowing line */}
              <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${line.replace('bg-', 'from-').replace('500', '400')} to-indigo-400 opacity-80 group-hover:opacity-100 transition-opacity`} />
              
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:scale-110 transition-transform duration-300">
                  <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-slate-500">
                  Dashboard
                </span>
              </div>
              
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                  {premium ? value : formatNumber(value)}
                </p>
              )}
              
              <div className="mt-2 flex flex-col gap-0.5">
                <h2 className="text-xs font-bold text-slate-600">{title}</h2>
                <span className="truncate text-[10px] font-medium text-slate-400">{note}</span>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.05fr_1.05fr]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Premium overview</p>
                  <h2 className="mt-0.5 text-base font-black text-slate-900">Policy premium split</h2>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><BarChart3 size={18} /></span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["OD Premium", premiumTotals.totalOd, "from-cyan-500/10 to-transparent border-cyan-200 text-cyan-700"],
                  ["TP Premium", premiumTotals.totalTp, "from-violet-500/10 to-transparent border-violet-200 text-violet-700"],
                  ["Net Premium", premiumTotals.netPremium, "from-emerald-500/10 to-transparent border-emerald-200 text-emerald-700"],
                  ["Gross Premium", premiumTotals.grossPremium, "from-amber-500/10 to-transparent border-amber-200 text-amber-700"],
                ].map(([label, value, styles]) => (
                  <div 
                    key={label} 
                    className={`rounded-xl border bg-gradient-to-br ${styles.split(' ').slice(0, 3).join(' ')} p-3 transition-all hover:shadow-sm`}
                  >
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</span>
                    {loading ? (
                      <div className="mt-2 h-5 w-20 animate-pulse rounded bg-slate-100" />
                    ) : (
                      <p className={`mt-1 truncate text-sm font-black ${styles.split(' ').slice(3).join(' ')}`}>
                        {money(value)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl bg-blue-50/50 px-3.5 py-2.5 text-[11px] font-semibold text-blue-700 leading-relaxed">
                {isAllData 
                  ? "Premium totals include all employee policy entries visible to Operations." 
                  : "Premium totals include policies created by your user account."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Monthly activity</p>
                  <h2 className="mt-0.5 text-base font-black text-slate-900">Entry comparison</h2>
                </div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${difference >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  {difference >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {difference > 0 ? "+" : ""}
                  {formatNumber(difference)}
                </div>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: periods.currentMonth, value: counts.currentMonth, color: "from-blue-500 to-indigo-600" },
                  { label: periods.lastMonth, value: counts.lastMonth, color: "from-slate-400 to-slate-500" },
                ].map((month) => (
                  <div key={month.label}>
                    <div className="mb-1.5 flex justify-between text-xs font-semibold text-slate-600">
                      <span>{month.label}</span>
                      <b className="text-slate-800">{formatNumber(month.value)}</b>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className={`h-full min-w-[6px] rounded-full bg-gradient-to-r ${month.color}`} 
                        style={{ width: `${month.value / maxMonth * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-xl bg-slate-50 px-3.5 py-2.5 text-[11px] font-semibold text-slate-500">
                {difference === 0 
                  ? "Your entry count is the same as last month." 
                  : `You have ${formatNumber(Math.abs(difference))} ${difference > 0 ? "more" : "fewer"} entries than last month.`}
              </p>
            </section>
          </div>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">POS performance</p>
                <h2 className="mt-0.5 text-base font-black text-slate-900">POS-wise count and premium</h2>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users size={16} /></span>
            </div>
            {loading ? <div className="space-y-2.5 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
              : posBreakdown.length === 0 ? <div className="flex min-h-48 items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">No POS premium data available.</div>
              : <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 overflow-y-auto max-h-[402px] overscroll-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
                {posBreakdown.slice(0, 7).map((row, index) => (
                  <div key={`${row.pos_id ?? "none"}-${index}`} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 hover:bg-blue-50/30 transition hover:border-blue-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-800" title={row.pos_display}>
                          {row.pos_display || "Unassigned POS"}
                        </p>
                        <span className="mt-1.5 inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
                          {formatNumber(row.policy_count)} policies
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-emerald-700">{compactMoney(row.net_premium)}</p>
                        <p className="text-[9px] font-medium text-slate-400">Gross {compactMoney(row.gross_premium)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600">Latest updates</p>
                <h2 className="mt-0.5 text-base font-black text-slate-900">Recent entries</h2>
              </div>
              <Link to="/operations/report-entry" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blue-600 hover:text-blue-700 transition-colors">
                View reports <ArrowRight size={14} />
              </Link>
            </div>
            {loading ? <div className="space-y-2.5 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
              : recentEntries.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center py-10"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"><Files size={20} /></div><h3 className="font-semibold text-slate-800">No policy entries yet</h3><p className="mt-1 text-xs text-slate-500">Your latest saved policies will appear here.</p></div>
              : <div className="divide-y divide-slate-100 overflow-y-auto overscroll-contain flex-1 max-h-[402px] [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">{recentEntries.slice(0, 8).map((entry) => <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/50 sm:px-5 transition-all">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Files size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-slate-800">{entry.insured_name || "Unnamed policy"}</p>
                  <p className="truncate text-[10px] font-semibold text-slate-400 mt-0.5">{entry.policy_number || "No policy number"} · <span className="text-slate-500 font-bold">{entry.insurance_company || "Company not set"}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                    String(entry.business_type).toLowerCase() === "new" ? "bg-emerald-50 text-emerald-700" :
                    String(entry.business_type).toLowerCase() === "renewal" ? "bg-blue-50 text-blue-700" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {entry.business_type || "Other"}
                  </span>
                  <p className="mt-1 text-[9px] font-bold text-slate-400">{formatDateTime(entry.created_at)}</p>
                  {isAllData && entry.created_by_display && (
                    <p className="text-[9px] font-medium text-slate-500 mt-0.5 truncate max-w-[80px] text-right" title={entry.created_by_display}>
                      {entry.created_by_display}
                    </p>
                  )}
                </div>
              </div>)}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
