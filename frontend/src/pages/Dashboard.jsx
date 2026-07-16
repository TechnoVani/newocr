import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ArrowRight, CalendarDays, Clock3, FilePlus2, Files, History, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import axiosInstance from "../config/axios";

const EMPTY = {
  counts: { total: 0, today: 0, currentMonth: 0, lastMonth: 0 },
  periods: { today: "Today", currentMonth: "Current month", lastMonth: "Last month" },
  recentEntries: [],
};
const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);
const formatDateTime = (value) => {
  const date = new Date(value);
  return !value || Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(date);
};

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);
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

  const { counts = EMPTY.counts, periods = EMPTY.periods, recentEntries = [] } = summary;
  const difference = counts.currentMonth - counts.lastMonth;
  const maxMonth = Math.max(counts.currentMonth, counts.lastMonth, 1);
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";
  const cards = [
    { title: "Today's entries", value: counts.today, note: periods.today, Icon: Clock3, color: "bg-blue-50 text-blue-600", line: "bg-blue-500" },
    { title: "This month", value: counts.currentMonth, note: periods.currentMonth, Icon: CalendarDays, color: "bg-emerald-50 text-emerald-600", line: "bg-emerald-500" },
    { title: "Last month", value: counts.lastMonth, note: periods.lastMonth, Icon: History, color: "bg-amber-50 text-amber-600", line: "bg-amber-500" },
    { title: "All entries", value: counts.total, note: "Your saved policies", Icon: Files, color: "bg-violet-50 text-violet-600", line: "bg-violet-500" },
  ];

  return (
    <main className="min-h-[calc(100vh-76px)] bg-slate-50 px-4 py-7 sm:px-6 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-[1480px]">
        <section className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d5cab] via-[#1676cc] to-[#29a1e6] px-6 py-8 text-white shadow-xl sm:px-9">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[40px] border-white/10" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-medium text-blue-100">Policy workspace overview</p>
              <h1 className="text-2xl font-bold sm:text-3xl">Good to see you, {firstName}</h1>
              <p className="mt-2 text-sm text-blue-100 sm:text-base">Track your entries and keep today&apos;s work moving.</p>
            </div>
            <Link to="/motor-entry" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50">
              <FilePlus2 size={18} /> New motor entry
            </Link>
          </div>
        </section>

        {error && <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700" role="alert">
          <span>{error}</span><button onClick={retryDashboard} className="inline-flex items-center gap-2 font-semibold"><RefreshCw size={15} /> Retry</button>
        </div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Entry totals">
          {cards.map(({ title, value, note, Icon, color, line }) => <article key={title} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className={`absolute inset-x-0 top-0 h-1 ${line}`} />
            <div className="mb-6 flex items-start justify-between"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon size={21} /></div><span className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Entries</span></div>
            {loading ? <div className="h-9 w-20 animate-pulse rounded bg-slate-100" /> : <p className="text-3xl font-bold text-slate-900">{formatNumber(value)}</p>}
            <div className="mt-2 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-700">{title}</h2><span className="truncate text-xs text-slate-400">{note}</span></div>
          </article>)}
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Monthly activity</p><h2 className="mt-1 text-lg font-bold text-slate-900">Entry comparison</h2></div>
              <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ${difference >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{difference >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}{difference > 0 ? "+" : ""}{formatNumber(difference)}</div>
            </div>
            <div className="space-y-5">{[
              { label: periods.currentMonth, value: counts.currentMonth, color: "bg-blue-500" },
              { label: periods.lastMonth, value: counts.lastMonth, color: "bg-slate-300" },
            ].map((month) => <div key={month.label}>
              <div className="mb-2 flex justify-between text-sm"><span className="font-medium text-slate-600">{month.label}</span><b>{formatNumber(month.value)}</b></div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full min-w-[3px] rounded-full ${month.color}`} style={{ width: `${month.value / maxMonth * 100}%` }} /></div>
            </div>)}</div>
            <p className="mt-7 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{difference === 0 ? "Your entry count is the same as last month." : `You have ${formatNumber(Math.abs(difference))} ${difference > 0 ? "more" : "fewer"} entries than last month.`}</p>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Latest updates</p><h2 className="mt-1 text-lg font-bold text-slate-900">Recent entries</h2></div><Link to="/report-entry" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">View reports <ArrowRight size={16} /></Link></div>
            {loading ? <div className="space-y-3 p-6">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
              : recentEntries.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500"><Files size={22} /></div><h3 className="font-semibold text-slate-800">No policy entries yet</h3><p className="mt-1 text-sm text-slate-500">Your latest saved policies will appear here.</p></div>
              : <div className="divide-y divide-slate-100">{recentEntries.map((entry) => <div key={entry.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 sm:px-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Files size={18} /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{entry.insured_name || "Unnamed policy"}</p><p className="truncate text-xs text-slate-500">{entry.policy_number || "No policy number"} · {entry.insurance_company || "Company not set"}</p></div>
                <div className="hidden text-right sm:block"><p className="text-xs font-medium text-slate-600">{entry.business_type || "—"}</p><p className="mt-1 text-[11px] text-slate-400">{formatDateTime(entry.created_at)}</p></div>
              </div>)}</div>}
          </section>
        </div>
      </div>
    </main>
  );
}
