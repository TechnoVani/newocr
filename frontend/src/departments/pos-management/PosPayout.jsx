import { useEffect, useMemo, useState } from "react";
import ReusableTable from "../../components/reusable/ReusableTable";
import { posApi } from "./posApi";
import { currency, exportRows, monthParts, monthValue } from "./posReportUtils";

export default function PosPayout() {
  const [month, setMonth] = useState(monthValue(new Date()));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const parts = monthParts(month);
    // A new month starts a new remote report request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    posApi.payout(parts.year, parts.month).then(data => setRows(data.rows || []))
      .catch(requestError => setError(requestError.response?.data?.message || "Unable to load payout report."))
      .finally(() => setLoading(false));
  }, [month]);

  const calculated = useMemo(() => rows.map(row => {
    const odCommission = (Number(row.total_od) || 0) * (Number(row.pos_od) || 0) / 100;
    const tpCommission = (Number(row.total_tp) || 0) * (Number(row.pos_tp) || 0) / 100;
    const netCommission = (Number(row.net_premium) || 0) * (Number(row.pos_net) || 0) / 100;
    return { ...row, odCommission, tpCommission, netCommission, totalCommission: odCommission + tpCommission + netCommission };
  }), [rows]);
  const total = calculated.reduce((sum, row) => sum + row.totalCommission, 0);
  const columns = [
    { key: "policy_number", label: "Policy No." },
    { key: "insured_name", label: "Customer Name" },
    { key: "insurance_company", label: "Insurance Company" },
    { key: "reference_display", label: "Reference" },
    { key: "total_od", label: "OD Premium", render: value => `₹${currency(value)}` },
    { key: "pos_od", label: "OD %" },
    { key: "odCommission", label: "OD Commission", render: value => `₹${currency(value)}` },
    { key: "total_tp", label: "TP Premium", render: value => `₹${currency(value)}` },
    { key: "pos_tp", label: "TP %" },
    { key: "tpCommission", label: "TP Commission", render: value => `₹${currency(value)}` },
    { key: "net_premium", label: "Net Premium", render: value => `₹${currency(value)}` },
    { key: "pos_net", label: "Net %" },
    { key: "netCommission", label: "Net Commission", render: value => `₹${currency(value)}` },
    { key: "totalCommission", label: "Total Commission", render: value => <span className="font-black text-emerald-700">₹{currency(value)}</span> },
  ];

  return <div className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-2xl font-black">{calculated.length}</p><p className="text-sm text-slate-500">Total Policies</p></article>
      <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm"><p className="text-2xl font-black text-emerald-800">₹{currency(total)}</p><p className="text-sm text-emerald-700">Total Commission</p></article>
    </div>
    <ReusableTable
      title="POS Payout Report"
      rows={calculated}
      columns={columns}
      loading={loading}
      error={error}
      filters={[{ name: "month", label: "Issue Month", render: <input type="month" value={month} onChange={event => setMonth(event.target.value)} className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold"/> }]}
      onExport={() => exportRows(calculated, "POS_Payout_Report", "Payout")}
      pageSizeOptions={[10, 20, 50]}
    />
  </div>;
}
