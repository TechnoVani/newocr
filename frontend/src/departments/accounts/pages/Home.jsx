import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  CircleDollarSign,
  FileCheck2,
  FileX2,
  FileSpreadsheet,
  GitBranch,
  IndianRupee,
  Landmark,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardHero from "../../../components/DashboardHero";
import useAuth from "../../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../../config/roleAccess";
import { accountsApi } from "../services/accountsApi";

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

const shortDate = value => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime())
    ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed)
    : "—";
};

const initialDashboard = (companies, branches) => ({
  period: { label: new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date()) },
  masters: {
    insurers: { total: companies.length, active: companies.filter(item => item.status === "Active").length },
    branches: { total: branches.length, active: branches.filter(item => item.status === "Active").length },
    pos: { total: 0, active: 0 },
    states_covered: new Set(branches.map(item => item.state).filter(Boolean)).size,
  },
  policies: {
    total: 0,
    current_month: 0,
    pending_verification: 0,
    pending_payment: 0,
    cancelled: 0,
    cancelled_current_month: 0,
    cancelled_net_premium: 0,
    cancelled_gross_premium: 0,
    net_premium: 0,
    gross_premium: 0,
  },
  trend: [],
  top_insurers: [],
  top_pos: [],
  recent_policies: [],
  payout_grid: { batches: 0, rules: 0, companies: 0, latest_month: null },
  visibility: "self",
});

function StatCard({ label, value, detail, icon: Icon, tone = "blue" }) {
  const styles = {
    blue: "from-blue-500/10 to-transparent border-blue-200 text-blue-600",
    emerald: "from-emerald-500/10 to-transparent border-emerald-200 text-emerald-600",
    amber: "from-amber-500/10 to-transparent border-amber-200 text-amber-600",
    violet: "from-violet-500/10 to-transparent border-violet-200 text-violet-600",
    rose: "from-rose-500/10 to-transparent border-rose-200 text-rose-600",
    cyan: "from-cyan-500/10 to-transparent border-cyan-200 text-cyan-600",
  };
  const glowIcons = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    rose: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };
  return (
    <article className={`rounded-2xl border bg-gradient-to-br ${styles[tone]} p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2.5 truncate text-lg font-black tracking-tight text-slate-900 leading-none">{value}</p>
          <p className="mt-1.5 text-[10px] font-semibold text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${glowIcons[tone]}`}><Icon size={18} /></span>
      </div>
    </article>
  );
}

function StatusPill({ value, kind }) {
  const normalized = String(value || "").toLowerCase();
  if (kind === "policy") {
    const cancelled = normalized === "cancelled";
    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
        cancelled ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}>
        {value || "Active"}
      </span>
    );
  }
  const positive = kind === "verification"
    ? normalized === "verified"
    : ["paid", "completed"].includes(normalized);
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
      positive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
    }`}>
      {value || "Pending"}
    </span>
  );
}

function EmptyPanel({ children }) {
  return <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center text-xs font-semibold text-slate-400">{children}</div>;
}

export default function Home({ companies = [], branches = [], dbStatus = "checking" }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const fallback = useMemo(() => initialDashboard(companies, branches), [branches, companies]);
  const [dashboard, setDashboard] = useState(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const nextDashboard = await accountsApi.dashboard();
      setDashboard(nextDashboard && typeof nextDashboard === "object" ? nextDashboard : fallback);
    } catch (requestError) {
      setDashboard(fallback);
      setError(requestError.response?.data?.message || "Live dashboard data is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, [fallback]);

  useEffect(() => {
    // Remote dashboard synchronization is intentionally triggered on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const trend = useMemo(() => {
    const byPeriod = new Map((dashboard.trend || []).map(item => [item.period, item]));
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return byPeriod.get(period) || {
        period,
        label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
        policies: 0,
        net_premium: 0,
      };
    });
  }, [dashboard.trend]);

  const maxTrend = Math.max(...trend.map(item => Number(item.net_premium) || 0), 1);
  const maxInsurer = Math.max(...(dashboard.top_insurers || []).map(item => Number(item.net_premium) || 0), 1);
  const policies = dashboard.policies || fallback.policies;
  const masters = dashboard.masters || fallback.masters;
  const payout = dashboard.payout_grid || fallback.payout_grid;
  const verificationRate = policies.current_month
    ? Math.round(((policies.current_month - policies.pending_verification) / policies.current_month) * 100)
    : 0;
  const connectionLabel = dbStatus === "connected" && !error ? "Live data" : dbStatus === "checking" ? "Connecting" : "Cached masters";

  return (
    <main className="relative mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-2.5 py-4 sm:px-4 lg:px-6 overflow-hidden">
      {/* Decorative Radial Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-400/5 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-indigo-400/5 blur-3xl pointer-events-none" />

      <DashboardHero
        eyebrow={`Accounts command center · ${dashboard.period?.label || fallback.period.label}`}
        description={`${dashboard.visibility === "all" ? "Department-wide" : "Assigned"} financial overview, reconciliation status, and insurer performance.`}
        actionTo="/accounts/reports/verify"
        actionLabel="Review Verification"
        actionIcon={BadgeCheck}
      />

      <div className="-mt-1 mb-4 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className={`h-2.5 w-2.5 rounded-full ${dbStatus === "connected" && !error ? "bg-emerald-500 animate-pulse" : dbStatus === "checking" ? "animate-pulse bg-amber-400" : "bg-rose-400"}`} />
          {connectionLabel}
          {error && <span className="hidden text-rose-600 sm:inline">· {error}</span>}
        </div>
        <button type="button" onClick={loadDashboard} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-700 disabled:opacity-60 hover:shadow-md">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh dashboard
        </button>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 relative z-10">
        <StatCard label="Gross premium" value={compactMoney(policies.gross_premium)} detail="Current issue month" icon={IndianRupee} tone="blue" />
        <StatCard label="Net premium" value={compactMoney(policies.net_premium)} detail={`${policies.current_month} policies this month`} icon={CircleDollarSign} tone="emerald" />
        <StatCard label="Verification" value={`${verificationRate}%`} detail={`${policies.pending_verification} awaiting review`} icon={FileCheck2} tone={policies.pending_verification ? "amber" : "emerald"} />
        <StatCard label="Payment queue" value={policies.pending_payment} detail="Pending or in process" icon={WalletCards} tone={policies.pending_payment ? "rose" : "cyan"} />
        <StatCard label="Cancelled policies" value={policies.cancelled || 0} detail={`${policies.cancelled_current_month || 0} this month · ${compactMoney(policies.cancelled_net_premium || 0)}`} icon={FileX2} tone={(policies.cancelled || 0) ? "rose" : "emerald"} />
        <StatCard label="Active insurers" value={`${masters.insurers.active}/${masters.insurers.total}`} detail={`${masters.states_covered} states covered`} icon={Building2} tone="violet" />
        <StatCard label="Active branches" value={`${masters.branches.active}/${masters.branches.total}`} detail="Insurer service locations" icon={GitBranch} tone="cyan" />
        <StatCard label="Active POS" value={`${masters.pos?.active || 0}/${masters.pos?.total || 0}`} detail="Partner distribution network" icon={Users} tone="violet" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr] relative z-10">
        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md hover:border-blue-100">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-900">Premium movement</p>
              <p className="mt-0.5 text-xs text-slate-500">Net premium across the last six issue months</p>
            </div>
            <div className="rounded-xl bg-blue-50/50 px-3.5 py-1.5 text-right border border-blue-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">This month</p>
              <p className="text-sm font-black text-blue-700">{money(policies.net_premium)}</p>
            </div>
          </header>
          <div className="px-5 pb-5 pt-6">
            <div className="flex h-44 items-end gap-3 sm:gap-4">
              {trend.map(item => {
                const height = Math.max(5, Math.round(((Number(item.net_premium) || 0) / maxTrend) * 100));
                return (
                  <div key={item.period} className="group flex h-full min-w-0 flex-1 flex-col justify-end">
                    <div className="mb-2 hidden text-center text-[10px] font-bold text-slate-400 sm:block">{item.policies} policies</div>
                    <div className="relative flex h-[78%] items-end overflow-hidden rounded-t-xl bg-slate-50">
                      <div style={{ height: `${height}%` }} className="w-full rounded-t-xl bg-gradient-to-t from-blue-600 via-blue-500 to-cyan-400 transition-all duration-500 group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-cyan-500">
                        <span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[9px] font-bold text-white group-hover:block">{compactMoney(item.net_premium)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-center text-xs font-bold text-slate-500">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-900">Top insurers</p>
              <p className="mt-0.5 text-xs text-slate-500">Current-month net premium</p>
            </div>
            <Landmark size={20} className="text-violet-500" />
          </div>
          {(dashboard.top_insurers || []).length ? (
            <div className="mt-4 space-y-4">
              {dashboard.top_insurers.map((item, index) => (
                <div key={item.insurer}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-black text-slate-500">{index + 1}</span>
                      <p className="truncate text-xs font-bold text-slate-700">{item.insurer}</p>
                    </div>
                    <p className="shrink-0 text-xs font-black text-slate-900">{compactMoney(item.net_premium)}</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div style={{ width: `${Math.max(4, (Number(item.net_premium) / maxInsurer) * 100)}%` }} className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="mt-5"><EmptyPanel>No insurer premium activity for this month.</EmptyPanel></div>}
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.6fr] relative z-10">
        <div className="grid gap-4">
          <article className="relative overflow-hidden rounded-2xl border border-slate-950/5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-md">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-300">Payout grid control</p>
                <p className="mt-2 text-2xl font-black tracking-tight">{payout.rules.toLocaleString("en-IN")} rules</p>
                <p className="mt-1 text-[11px] text-slate-400">{payout.batches} upload batches · {payout.companies} insurers</p>
              </div>
              <FileSpreadsheet className="text-blue-300" size={24} />
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 border border-white/5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Latest grid</p>
                <p className="mt-1 text-sm font-bold">{payout.latest_month || "Not uploaded"}</p>
              </div>
              <Link to="/accounts/payout-grid/report" className="inline-flex items-center gap-1 text-xs font-bold text-blue-300 hover:text-white transition-colors">Open report <ArrowRight size={13} /></Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-900">Leading POS partners</p>
                <p className="mt-0.5 text-xs text-slate-500">Current-month net premium</p>
              </div>
              <Link to="/accounts/reports/pos-wise" className="text-xs font-black text-blue-600 hover:text-blue-800">Full report</Link>
            </div>
            {(dashboard.top_pos || []).length ? (
              <div className="mt-3 space-y-2.5">
                {dashboard.top_pos.slice(0, 4).map((item, index) => (
                  <div key={`${item.pos_id ?? "none"}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50/50 border border-slate-100 px-3 py-2.5 hover:bg-blue-50/20 transition-colors">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[10px] font-black text-blue-700">{index + 1}</span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-slate-700">{item.pos_name}</p>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{item.pos_code} · {item.policies} policies · {item.cancelled || 0} cancelled</p>
                      </div>
                    </div>
                    <p className="shrink-0 text-xs font-black text-slate-900">{compactMoney(item.net_premium)}</p>
                  </div>
                ))}
              </div>
            ) : <div className="mt-4"><EmptyPanel>No POS-linked policy activity this month.</EmptyPanel></div>}
          </article>

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-slate-900">Quick actions</p>
                <p className="mt-0.5 text-xs text-slate-500">Common Accounts workflows</p>
              </div>
              <BarChart3 size={20} className="text-blue-500" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
              {[
                { to: "/accounts/reports/insured-wise", label: "Policy ledger", icon: FileCheck2 },
                { to: "/accounts/reports/verify", label: "Verify statement", icon: BadgeCheck },
                { to: "/accounts/reports/pos-wise", label: "POS profitability", icon: Users },
                { to: "/accounts/payout-grid/report", label: "Payout lookup", icon: TrendingUp },
                ...(canManage ? [{ to: "/accounts/masters/insurers", label: "Manage insurers", icon: Building2 }] : []),
              ].map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="group flex items-center justify-between rounded-xl border border-slate-150 bg-slate-50/50 px-3 py-2.5 text-xs font-extrabold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-sm hover:shadow-md">
                  <span className="flex items-center gap-2"><Icon size={15} />{label}</span>
                  <ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </article>
        </div>

        <article className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md hover:border-blue-100 flex flex-col h-full">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <p className="text-sm font-black text-slate-900">Recent policy activity</p>
              <p className="mt-0.5 text-xs text-slate-500">{policies.total.toLocaleString("en-IN")} policies visible in your account scope</p>
            </div>
            <Link to="/accounts/reports/insured-wise" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800">View full ledger <ArrowRight size={13} /></Link>
          </header>
          {(dashboard.recent_policies || []).length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Policy / Insured</th>
                    <th className="px-5 py-3">Insurer</th>
                    <th className="px-5 py-3">Issue / Cancel Date</th>
                    <th className="px-5 py-3">Policy status</th>
                    <th className="px-5 py-3">Net premium</th>
                    <th className="px-5 py-3">Verification</th>
                    <th className="px-5 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.recent_policies.map(row => (
                    <tr key={row.report_row_id || row.id} className="transition hover:bg-blue-50/20">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-black text-slate-800">{row.policy_number}</p>
                        <p className="mt-1 max-w-48 truncate text-[11px] font-semibold text-slate-400">{row.policy_status || "Active"} · {row.insured_name || "Unnamed insured"}</p>
                      </td>
                      <td className="max-w-44 truncate px-5 py-3.5 text-xs font-semibold text-slate-600">{row.insurance_company || "—"}</td>
                      <td className="px-5 py-3.5 text-xs font-medium text-slate-500">{shortDate(row.activity_date || row.cancellation_record_created_at || row.issue_date)}</td>
                      <td className="px-5 py-3.5"><StatusPill value={row.policy_status} kind="policy" /></td>
                      <td className="px-5 py-3.5 text-xs font-black text-slate-800">{money(row.net_premium)}</td>
                      <td className="px-5 py-3.5"><StatusPill value={row.verification_status} kind="verification" /></td>
                      <td className="px-5 py-3.5"><StatusPill value={row.payment_status} kind="payment" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5"><EmptyPanel><span className="flex flex-col items-center gap-2"><CalendarDays size={22} />No recent policy activity is available.</span></EmptyPanel></div>
          )}
        </article>
      </section>

      {(policies.pending_verification > 0 || policies.pending_payment > 0) && (
        <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-start gap-3">
            <ShieldAlert size={20} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-black text-amber-900">Accounts attention required</p>
              <p className="mt-0.5 text-xs font-medium text-amber-700">{policies.pending_verification} policies need verification and {policies.pending_payment} have pending payment status.</p>
            </div>
          </div>
          <Link to="/accounts/reports/verify" className="inline-flex shrink-0 items-center gap-2 text-xs font-black text-amber-850 hover:text-amber-950 transition-colors">Resolve queue <ArrowRight size={14} /></Link>
        </section>
      )}
    </main>
  );
}
