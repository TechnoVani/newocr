import { useEffect, useMemo, useState } from "react";
import ReusableTable from "../../components/reusable/ReusableTable";
import { posApi } from "./posApi";
import { currency, exportRows, monthParts, monthValue, policyColumns } from "./posReportUtils";
import {
  BusinessMixDonut,
  InsurerMixChart,
  MotorPremiumChart,
  OverallBusinessSummary,
  PoliciesByTypeChart,
  PremiumMixDonut,
} from "./charts/PosCharts";

export default function PosReports() {
  const [month, setMonth] = useState(monthValue(new Date()));
  const [report, setReport] = useState({ policies: [], summary: {} });
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const { year, month: monthNumber } = monthParts(month);
    // A new month starts a new remote report request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([posApi.reports(year, monthNumber), posApi.analytics()]).then(([monthly, chartData]) => {
      setReport(monthly);
      setAnalytics(chartData);
    })
      .catch(requestError => setError(requestError.response?.data?.message || "Unable to load report."))
      .finally(() => setLoading(false));
  }, [month]);

  const business = useMemo(() => Object.values((report.policies || []).reduce((groups, row) => {
    const key = row.product_type || "Other";
    groups[key] ||= { policyType: key, policyCount: 0, odPremium: 0, tpPremium: 0, netPremium: 0 };
    groups[key].policyCount += 1;
    groups[key].odPremium += Number(row.total_od) || 0;
    groups[key].tpPremium += Number(row.total_tp) || 0;
    groups[key].netPremium += Number(row.net_premium) || 0;
    return groups;
  }, {})), [report.policies]);

  const columns = [
    { key: "policyType", label: "Product Type" },
    { key: "policyCount", label: "Policy Count" },
    { key: "odPremium", label: "OD Premium", render: value => `₹${currency(value)}` },
    { key: "tpPremium", label: "TP Premium", render: value => `₹${currency(value)}` },
    { key: "netPremium", label: "Net Premium", render: value => `₹${currency(value)}` },
  ];

  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ["Policy Count", report.summary?.policyCount || 0],
        ["Net Premium", `₹${currency(report.summary?.netPremium)}`],
        ["GST", `₹${currency(report.summary?.gst)}`],
        ["Gross Premium", `₹${currency(report.summary?.totalPayable)}`],
      ].map(([label, value]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-2xl font-black text-slate-900">{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></article>)}
    </div>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <BusinessMixDonut rows={analytics?.businessMix} period={analytics?.period?.label} loading={loading}/>
      <div className="lg:col-span-2"><PoliciesByTypeChart rows={analytics?.businessMix} period={analytics?.period?.label} loading={loading}/></div>
    </div>
    <MotorPremiumChart rows={analytics?.motorBreakdown} loading={loading}/>
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <InsurerMixChart rows={analytics?.insurerMix} loading={loading}/>
      <PremiumMixDonut rows={analytics?.premiumMix} loading={loading}/>
    </div>
    <OverallBusinessSummary rows={analytics?.businessMix} totals={analytics?.totals} period={analytics?.period?.label} loading={loading}/>
    <ReusableTable
      title="POS Business Mix Report"
      rows={business}
      columns={columns}
      loading={loading}
      error={error}
      filters={[{ name: "month", label: "Issue Month", render: <input type="month" value={month} onChange={event => setMonth(event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"/> }]}
      onExport={() => exportRows(report.policies || [], "POS_Business_Report", "Business Report")}
    />
    <ReusableTable title="Policy Detail Report" rows={report.policies || []} columns={policyColumns} loading={loading}/>
  </div>;
}
