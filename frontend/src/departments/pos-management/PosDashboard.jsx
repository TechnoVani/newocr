import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, Files, RefreshCw, TrendingUp } from "lucide-react";
import DashboardHero from "../../components/DashboardHero";
import { posApi } from "./posApi";
import { currency } from "./posReportUtils";
import ReusableTable from "../../components/reusable/ReusableTable";
import {
  BusinessDetails,
  BusinessMixDonut,
  MonthlyComparisonChart,
  RenewalTrendChart,
} from "./charts/PosCharts";

export default function PosDashboard() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([posApi.dashboard(), posApi.analytics()])
      .then(([dashboard, chartData]) => { setData(dashboard); setAnalytics(chartData); })
      .catch(error => setError(error.response?.data?.message || "Unable to load POS dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const renewalColumns = useMemo(() => [
    { key: "days_to_expiry", label: "Days Left", render: value => <span className="font-black text-amber-700">{value} days</span> },
    { key: "policy_number", label: "Policy No." },
    { key: "insured_name", label: "Customer Name" },
    { key: "insurance_company", label: "Insurance Company" },
    { key: "product_type", label: "Product Type" },
    { key: "registration_number", label: "Registration No." },
    { key: "expiry_date", label: "Expiry Date" },
    { key: "net_premium", label: "Net Premium", render: value => `₹${currency(value)}` },
  ], []);
  const expiredColumns = useMemo(() => [
    { key: "days_expired", label: "Days Expired", render: value => <span className="font-black text-red-700">{value} days</span> },
    ...renewalColumns.filter(column => column.key !== "days_to_expiry"),
  ], [renewalColumns]);

  const cards = [
    { label: "Total Policies", value: data?.totals?.policyCount ?? 0, icon: Files },
    { label: "OD Premium", value: `₹${currency(data?.totals?.odPremium)}`, icon: TrendingUp },
    { label: "TP Premium", value: `₹${currency(data?.totals?.tpPremium)}`, icon: RefreshCw },
    { label: "Net Premium", value: `₹${currency(data?.totals?.netPremium)}`, icon: CircleDollarSign },
  ];

  return <>
    <DashboardHero
      eyebrow="POS business overview"
      description="Track issued policies, premium and recent POS activity from one workspace."
      actionTo="/pos-management/motor-entry"
      actionLabel="New Motor Policy"
      actionIcon={Files}
    />
    {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Icon size={18}/></span>
          <span className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">POS</span>
        </div>
        <p className="mt-4 truncate text-xl font-black text-slate-900">{value}</p>
        <p className="mt-0.5 text-xs font-bold text-slate-500">{label}</p>
      </article>)}
    </section>
    <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <BusinessMixDonut rows={analytics?.businessMix} period={analytics?.period?.label} loading={loading}/>
        <RenewalTrendChart rows={analytics?.monthlyComparison} period={analytics?.period?.label} loading={loading}/>
      </div>
      <BusinessDetails motor={analytics?.motorBreakdown} other={analytics?.businessMix} loading={loading}/>
    </section>
    <section className="mt-4">
      <MonthlyComparisonChart rows={analytics?.monthlyComparison} period={analytics?.period?.label} previousPeriod={analytics?.period?.previousLabel} loading={loading}/>
    </section>
    <section className="mt-4">
      <ReusableTable title="Policies Renewal Report (Next 45 Days)" rows={analytics?.upcomingRenewals || []} columns={renewalColumns} loading={loading} emptyMessage="No policies expire within the next 45 days."/>
    </section>
    <section className="mt-4">
      <ReusableTable title="Expired Policies Report" rows={analytics?.expiredPolicies || []} columns={expiredColumns} loading={loading} emptyMessage="No unrenewed expired policies found."/>
    </section>
    <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-black text-slate-900">Recent Policy Activity</h2>
      <div className="mt-3 divide-y divide-slate-100">
        {(data?.recentEntries || []).map(row => <div key={row.id} className="grid gap-2 py-3 text-xs sm:grid-cols-[1fr_1fr_160px]">
          <span className="font-bold text-slate-800">{row.policy_number}</span>
          <span className="text-slate-600">{row.insured_name || "—"} · {row.insurance_company || "—"}</span>
          <span className="text-slate-500">{row.created_by_display || "—"}</span>
        </div>)}
        {!data?.recentEntries?.length && <p className="py-10 text-center text-xs font-semibold text-slate-400">No policy activity available.</p>}
      </div>
    </section>
  </>;
}
