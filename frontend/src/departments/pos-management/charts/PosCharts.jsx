import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Car, PieChart as PieChartIcon } from "lucide-react";
import { currency } from "../posReportUtils";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444", "#0891b2", "#db2777", "#65a30d"];
const compact = value => {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 10000000) return `₹${(number / 10000000).toFixed(1)}Cr`;
  if (Math.abs(number) >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
  if (Math.abs(number) >= 1000) return `₹${(number / 1000).toFixed(1)}K`;
  return `₹${number.toFixed(0)}`;
};
const tooltipStyle = {
  backgroundColor: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  boxShadow: "0 8px 30px rgb(15 23 42 / 0.12)",
  fontSize: 12,
};

export function ChartCard({ title, subtitle = "", children, className = "", empty = false, loading = false }) {
  return <section className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 px-4 py-3 text-center text-white">
      <h2 className="text-sm font-black sm:text-base">{title}</h2>
      {subtitle && <p className="mt-0.5 text-[10px] font-semibold text-blue-100 sm:text-xs">{subtitle}</p>}
    </header>
    <div className="p-4 sm:p-5">
      {loading ? <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400">Loading chart…</div>
        : empty ? <div className="flex h-64 items-center justify-center text-xs font-bold text-slate-400">No chart data available.</div>
          : children}
    </div>
  </section>;
}

export function BusinessMixDonut({ rows = [], period, loading = false }) {
  return <ChartCard title={`All Business Mix (${period || "Current FY"})`} subtitle="Policy count and net premium distribution" empty={!rows.length} loading={loading}>
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="policyCount" nameKey="label" innerRadius={62} outerRadius={95} paddingAngle={3}>
            {rows.map((row, index) => <Cell key={row.label} fill={COLORS[index % COLORS.length]}/>)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name, item) => [`${value} policies · ₹${currency(item.payload.premium)}`, name]}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      {rows.map((row, index) => <span key={row.label} className="flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-600">
        <i className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }}/>
        {row.label} ({row.percent}%)
      </span>)}
    </div>
  </ChartCard>;
}

export function RenewalTrendChart({ rows = [], period, loading = false }) {
  return <ChartCard title={`Renewals This Year (${period || "Current FY"})`} subtitle="Expiry-month policy count and premium" empty={!rows.length} loading={loading}>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 8, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
          <XAxis dataKey="month" tick={{ fontSize: 10 }}/>
          <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 10 }} width={34}/>
          <YAxis yAxisId="premium" orientation="right" tickFormatter={compact} tick={{ fontSize: 10 }} width={55}/>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === "Renewal Premium" ? [`₹${currency(value)}`, name] : [value, name]}/>
          <Legend wrapperStyle={{ fontSize: 11 }}/>
          <Bar yAxisId="count" dataKey="renewals" name="Renewal Policies" fill="#3b82f6" radius={[5, 5, 0, 0]}/>
          <Bar yAxisId="premium" dataKey="renewalPremium" name="Renewal Premium" fill="#22c55e" radius={[5, 5, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function MonthlyComparisonChart({ rows = [], period, previousPeriod, loading = false }) {
  return <ChartCard title="Monthly Policy & Premium Comparison" subtitle={`Policy issue date based · ${previousPeriod || "Previous FY"} vs ${period || "Current FY"}`} empty={!rows.length} loading={loading}>
    <div className="h-[390px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
          <XAxis dataKey="month" tick={{ fontSize: 10 }}/>
          <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 10 }} width={34}/>
          <YAxis yAxisId="premium" orientation="right" tickFormatter={compact} tick={{ fontSize: 10 }} width={58}/>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name.includes("Premium") ? [`₹${currency(value)}`, name] : [value, name]}/>
          <Legend wrapperStyle={{ fontSize: 10 }}/>
          <Bar yAxisId="count" dataKey="previousPolicies" name="Previous FY Policies" fill="#93c5fd" radius={[4, 4, 0, 0]}/>
          <Bar yAxisId="premium" dataKey="previousPremium" name="Previous FY Premium" fill="#c4b5fd" radius={[4, 4, 0, 0]}/>
          <Bar yAxisId="count" dataKey="currentPolicies" name="Current FY Policies" fill="#2563eb" radius={[4, 4, 0, 0]}/>
          <Bar yAxisId="premium" dataKey="currentPremium" name="Current FY Premium" fill="#22c55e" radius={[4, 4, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function BusinessDetails({ motor = [], other = [], loading = false }) {
  const all = [...motor, ...other.filter(row => row.label !== "Motor")];
  return <ChartCard title="Business Details" subtitle="LOB, category and vehicle classification" empty={!all.length} loading={loading} className="h-full">
    <div className="mb-3 flex items-center justify-center gap-2">
      <span className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"><Car size={14}/> Motor</span>
      <span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700"><BarChart3 size={14}/> Other LOBs</span>
    </div>
    <div className="grid max-h-[620px] gap-3 overflow-y-auto sm:grid-cols-2">
      {all.map((row, index) => <article key={`${row.label}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }}/>
          <p className="truncate font-black text-slate-800">{row.label}</p>
        </div>
        <div className="mt-3 flex justify-between"><span className="text-slate-500">Policies</span><strong>{row.policyCount}</strong></div>
        <div className="mt-1 flex justify-between"><span className="text-slate-500">Premium</span><strong className="text-emerald-700">₹{currency(row.premium)}</strong></div>
      </article>)}
    </div>
  </ChartCard>;
}

export function PoliciesByTypeChart({ rows = [], period, loading = false }) {
  return <ChartCard title={`Policies & Premium by LOB (${period || "Current FY"})`} subtitle="Policies and net premium distribution" empty={!rows.length} loading={loading}>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 12, left: 0, bottom: 25 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
          <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-15} textAnchor="end"/>
          <YAxis yAxisId="count" allowDecimals={false} tick={{ fontSize: 10 }} width={34}/>
          <YAxis yAxisId="premium" orientation="right" tickFormatter={compact} tick={{ fontSize: 10 }} width={55}/>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => name === "Premium" ? [`₹${currency(value)}`, name] : [value, name]}/>
          <Legend wrapperStyle={{ fontSize: 11 }}/>
          <Bar yAxisId="count" dataKey="policyCount" name="Policies" fill="#93c5fd" radius={[5, 5, 0, 0]}/>
          <Bar yAxisId="premium" dataKey="premium" name="Premium" fill="#86efac" radius={[5, 5, 0, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function MotorPremiumChart({ rows = [], loading = false }) {
  return <ChartCard title="Motor Premium by Vehicle Classification" subtitle="Current financial year · NOP shown in tooltip" empty={!rows.length} loading={loading}>
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 5, right: 15, left: 15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
          <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 10 }}/>
          <YAxis type="category" dataKey="label" width={125} tick={{ fontSize: 10 }}/>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name, item) => [`₹${currency(value)} · ${item.payload.policyCount} policies`, name]}/>
          <Bar dataKey="premium" name="Net Premium" radius={[0, 7, 7, 0]}>
            {rows.map((row, index) => <Cell key={row.label} fill={COLORS[index % COLORS.length]}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function InsurerMixChart({ rows = [], loading = false }) {
  const topRows = rows.slice(0, 12);
  return <ChartCard title="Insurance Company Business Mix" subtitle="Top insurers by current-FY net premium" empty={!topRows.length} loading={loading}>
    <div className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={topRows} layout="vertical" margin={{ top: 5, right: 15, left: 25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
          <XAxis type="number" tickFormatter={compact} tick={{ fontSize: 10 }}/>
          <YAxis type="category" dataKey="label" width={145} tick={{ fontSize: 9 }}/>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name, item) => [`₹${currency(value)} · ${item.payload.policyCount} policies`, name]}/>
          <Bar dataKey="premium" name="Net Premium" fill="#2563eb" radius={[0, 7, 7, 0]}/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function PremiumMixDonut({ rows = [], loading = false }) {
  return <ChartCard title="Premium Composition" subtitle="OD, TP and Net premium totals" empty={!rows.some(row => row.value)} loading={loading}>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={3}>
            {rows.map((row, index) => <Cell key={row.label} fill={COLORS[index % COLORS.length]}/>)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [`₹${currency(value)}`, name]}/>
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>;
}

export function OverallBusinessSummary({ rows = [], totals = {}, period, loading = false }) {
  return <ChartCard title={`Overall Business Summary (${period || "Current FY"})`} subtitle="LOB and vehicle-classification summary" empty={!rows.length} loading={loading}>
    <div className="mb-4 grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl bg-blue-50 p-3"><p className="text-[10px] font-bold uppercase text-blue-600">Total Policies</p><p className="mt-1 text-xl font-black text-blue-900">{totals.policyCount || 0}</p></div>
      <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[10px] font-bold uppercase text-emerald-600">Total Net Premium</p><p className="mt-1 text-xl font-black text-emerald-900">₹{currency(totals.netPremium)}</p></div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-xs">
        <thead><tr className="bg-slate-100 text-slate-600"><th className="p-3">LOB / Classification</th><th className="p-3 text-right">Policies</th><th className="p-3 text-right">Premium</th><th className="p-3 text-right">Share</th></tr></thead>
        <tbody>
          {rows.map(row => <tr key={row.label} className="border-t border-slate-100"><td className="p-3 font-bold text-slate-800">{row.label}</td><td className="p-3 text-right text-blue-700">{row.policyCount}</td><td className="p-3 text-right text-emerald-700">₹{currency(row.premium)}</td><td className="p-3 text-right">{row.percent}%</td></tr>)}
        </tbody>
      </table>
    </div>
  </ChartCard>;
}

export function AnalyticsEmpty() {
  return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
    <PieChartIcon size={32}/><p className="mt-2 text-xs font-bold">No analytics available.</p>
  </div>;
}
