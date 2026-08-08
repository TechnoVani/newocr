import { useEffect, useMemo, useState } from "react";
import ReusableTable from "../../components/reusable/ReusableTable";
import { posApi } from "./posApi";
import { exportRows, monthParts, monthValue, policyColumns } from "./posReportUtils";

export default function PosPolicyReport({ renewal = false }) {
  const [month, setMonth] = useState(monthValue(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lob, setLob] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    // A new filter selection starts a new remote report request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    const { year, month: monthNumber } = monthParts(month);
    const request = renewal ? posApi.renewals({ type: "upcoming" }) : posApi.reports(year, monthNumber);
    request.then(data => {
      const policies = data?.policies || [];
      setRows(policies);
    }).catch(requestError => setError(requestError.response?.data?.message || "Unable to load policies."))
      .finally(() => setLoading(false));
  }, [month, renewal]);

  const lobs = useMemo(() => [...new Set(rows.map(row => row.product_type).filter(Boolean))].sort(), [rows]);
  const categories = useMemo(() => [...new Set(rows.map(row => row.categories).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter(row =>
    (!lob || row.product_type === lob) && (!category || row.categories === category)
  ), [rows, lob, category]);

  return <ReusableTable
    title={renewal ? "Upcoming Policy Report" : "Issued Policies Report"}
    subtitle={`${renewal ? "Today to Next 45 Days" : month} · ${filtered.length} policies`}
    rows={filtered}
    columns={policyColumns}
    loading={loading}
    error={error}
    pageSize={10}
    pageSizeOptions={[10, 20, 50]}
    filters={[
      ...(!renewal ? [{ name: "month", label: "Issue Month", render: <input type="month" value={month} onChange={event => { setMonth(event.target.value); setLob(""); setCategory(""); }} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"/> }] : []),
      { name: "lob", label: "Product Type", value: lob, options: [{ value: "", label: "All Types" }, ...lobs], onChange: event => setLob(event.target.value), clearable: true },
      { name: "category", label: "Category", value: category, options: [{ value: "", label: "All Categories" }, ...categories], onChange: event => setCategory(event.target.value), clearable: true },
    ]}
    onResetFilters={() => { setLob(""); setCategory(""); }}
    onExport={() => exportRows(filtered, renewal ? "POS_Upcoming_Policies" : "POS_Policies", renewal ? "Upcoming Policies" : "Policies")}
    emptyMessage={renewal ? "No upcoming policies found for the next 45 days." : "No policies found for the selected month."}
  />;
}
