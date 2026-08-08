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
  const maxPosPremium = Math.max(...posBreakdown.map((row) => Number(row.net_premium) || 0), 1);
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
    <main className="flex-1 bg-slate-50 px-3 py-4 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-[1480px]">
        <DashboardHero
          description={isAllData ? "Viewing policy activity for all employees." : "Track your entries and keep today's work moving."}
          actionTo="/operations/motor-entry"
          actionLabel="New Motor Entry"
        />

        {error && <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700" role="alert">
          <span>{error}</span><button onClick={retryDashboard} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={15} /> Retry</button>
        </div>}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Entry totals">
          {cards.map(({ title, value, note, Icon, color, line, premium }) => <article key={title} className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
            <div className={`absolute inset-y-0 left-0 w-1 ${line}`} />
            <div className="mb-4 flex items-start justify-between"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}><Icon size={18} /></div><span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Entries</span></div>
            {loading ? <div className="h-7 w-16 animate-pulse rounded bg-slate-100" /> : <p className="text-2xl font-black text-slate-900">{premium ? value : formatNumber(value)}</p>}
            <div className="mt-1.5 flex items-center justify-between gap-3"><h2 className="text-xs font-bold text-slate-700">{title}</h2><span className="truncate text-[11px] text-slate-400">{note}</span></div>
          </article>)}
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.05fr_1.05fr]">
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Premium overview</p><h2 className="mt-1 text-lg font-bold text-slate-900">Policy premium split</h2></div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><BarChart3 size={18} /></span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["OD Premium", premiumTotals.totalOd, "bg-cyan-500"],
                  ["TP Premium", premiumTotals.totalTp, "bg-violet-500"],
                  ["Net Premium", premiumTotals.netPremium, "bg-emerald-500"],
                  ["Gross Premium", premiumTotals.grossPremium, "bg-amber-500"],
                ].map(([label, value, color]) => (
                  <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{label}</span>
                      <span className={`h-2 w-2 rounded-full ${color}`} />
                    </div>
                    {loading ? <div className="h-5 w-20 animate-pulse rounded bg-slate-200" /> : <p className="truncate text-sm font-black text-slate-900">{money(value)}</p>}
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-lg bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700">{isAllData ? "Premium totals include all employee policy entries visible to Operations." : "Premium totals include policies created by your user account."}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Monthly activity</p><h2 className="mt-1 text-lg font-bold text-slate-900">Entry comparison</h2></div>
                <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${difference >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{difference >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{difference > 0 ? "+" : ""}{formatNumber(difference)}</div>
              </div>
              <div className="space-y-4">{[
                { label: periods.currentMonth, value: counts.currentMonth, color: "bg-blue-500" },
                { label: periods.lastMonth, value: counts.lastMonth, color: "bg-slate-300" },
              ].map((month) => <div key={month.label}>
                <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">{month.label}</span><b>{formatNumber(month.value)}</b></div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full min-w-[3px] rounded-full ${month.color}`} style={{ width: `${month.value / maxMonth * 100}%` }} /></div>
              </div>)}</div>
              <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">{difference === 0 ? "Your entry count is the same as last month." : `You have ${formatNumber(Math.abs(difference))} ${difference > 0 ? "more" : "fewer"} entries than last month.`}</p>
            </section>
          </div>

          <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5">
              <div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">POS performance</p><h2 className="mt-0.5 text-base font-black text-slate-900">POS-wise count and premium</h2></div>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Users size={16} /></span>
            </div>
            {loading ? <div className="space-y-2.5 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
              : posBreakdown.length === 0 ? <div className="flex min-h-48 items-center justify-center px-6 text-center text-xs font-semibold text-slate-400">No POS premium data available.</div>
              : <div className="max-h-[402px] divide-y divide-slate-100 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]">
                {posBreakdown.map((row, index) => (
                  <div key={`${row.pos_id ?? "none"}-${index}`} className="px-4 py-3 hover:bg-slate-50 sm:px-5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-800">{row.pos_display || "Unassigned POS"}</p>
                        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{formatNumber(row.policy_count)} policies · Gross {compactMoney(row.gross_premium)}</p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-emerald-700">{compactMoney(row.net_premium)}</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full min-w-[4px] rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.max(4, (Number(row.net_premium) || 0) / maxPosPremium * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>}
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Latest updates</p><h2 className="mt-0.5 text-base font-black text-slate-900">Recent entries</h2></div><Link to="/operations/report-entry" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600">View reports <ArrowRight size={15} /></Link></div>
            {loading ? <div className="space-y-2.5 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
              : recentEntries.length === 0 ? <div className="flex min-h-48 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500"><Files size={20} /></div><h3 className="font-semibold text-slate-800">No policy entries yet</h3><p className="mt-1 text-xs text-slate-500">Your latest saved policies will appear here.</p></div>
              : <div className="divide-y divide-slate-100">{recentEntries.map((entry) => <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 sm:px-5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Files size={16} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{entry.insured_name || "Unnamed policy"}</p><p className="truncate text-xs text-slate-500">{entry.policy_number || "No policy number"} · {entry.insurance_company || "Company not set"}</p></div>
                <div className="hidden text-right sm:block"><p className="text-xs font-medium text-slate-600">{isAllData ? entry.created_by_display || "—" : entry.business_type || "—"}</p><p className="mt-1 text-[11px] text-slate-400">{formatDateTime(entry.created_at)}</p></div>
              </div>)}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
