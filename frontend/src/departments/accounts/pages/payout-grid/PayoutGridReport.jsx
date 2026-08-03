import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import { accountsApi } from "../../services/accountsApi";
import { exportPayoutReport } from "./payoutGridExcel";

const initialFilters = {
  company: "",
  month: "",
  business_type: "",
  category: "",
  classification: "",
  rto: "",
  seat: "",
  gvw: "",
  cc: "",
  fuel_type: "",
  make: "",
  model: "",
  ncb: "",
};

const commission = (value) => value === null || value === undefined || value === "" ? "—" : `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 4 })}%`;

export default function PayoutGridReport() {
  const [filters, setFilters] = useState(initialFilters);
  const [report, setReport] = useState({ rows: [], total: 0, options: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async (params = filters) => {
    setLoading(true);
    setError("");
    try {
      setReport(await accountsApi.payoutGridReport(params));
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to load payout-grid report.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    accountsApi.payoutGridReport()
      .then(setReport)
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load payout-grid report."))
      .finally(() => setLoading(false));
  }, []);

  const update = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const reset = () => {
    setFilters(initialFilters);
    setExpandedId(null);
    load(initialFilters);
  };

  const columns = useMemo(() => [
    { key: "company", label: "Company" },
    { key: "month", label: "Month" },
    { key: "business_type", label: "Business Type" },
    { key: "category", label: "Category" },
    { key: "classification", label: "Classification" },
    { key: "product_type", label: "Product Type" },
    { key: "OD_Comm", label: "OD Comm", render: commission },
    { key: "TP_Comm", label: "TP Comm", render: commission },
    { key: "NET_Comm", label: "Net Comm", render: commission },
    {
      key: "remarks",
      label: "Applicability",
      searchValue: (row) => Object.values(row.remarks || {}).join(" "),
      render: (_, row) => (
        <button type="button" onClick={() => setExpandedId((current) => current === row.id ? null : row.id)} className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">
          Details {expandedId === row.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      ),
    },
  ], [expandedId]);

  const selected = report.rows.find((row) => row.id === expandedId);
  const remarks = [
    ["CC", "cc"], ["Fuel Type", "fuel_type"], ["Make", "make"],
    ["Decline Make", "decline_make"], ["Model", "model"], ["Decline Model", "decline_model"],
    ["NCB", "ncb"], ["Seat", "seat"], ["GVW", "gvw"], ["RTO", "rto"],
  ];

  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-6 sm:px-6 lg:px-10">
      <Toaster position="top-right" />
      <form onSubmit={(event) => { event.preventDefault(); load(); }} className="mb-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Accounts · Payout Grid</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Commission payout report</h1>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["company", "Company", report.options?.companies],
            ["month", "Month", report.options?.months],
            ["business_type", "Business Type", report.options?.businessTypes],
            ["category", "Vehicle Category", report.options?.categories],
            ["classification", "Classification", report.options?.classifications],
          ].map(([name, label, values]) => (
            <label key={name} className="relative block pt-2">
              <span className="pointer-events-none absolute left-3 top-0 z-10 max-w-[calc(100%-1.5rem)] truncate bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">{label}</span>
              <select name={name} value={filters[name]} onChange={update} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500">
                <option value="">All {label}</option>
                {(values || []).map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          ))}
          {[
            ["rto", "RTO code"],
            ["seat", "Seat"],
            ["gvw", "GVW"],
            ["cc", "CC"],
            ["fuel_type", "Fuel type"],
            ["make", "Vehicle make"],
            ["model", "Vehicle model"],
            ["ncb", "NCB %"],
          ].map(([name, label]) => (
            <label key={name} className="relative block pt-2">
              <span className="pointer-events-none absolute left-3 top-0 z-10 max-w-[calc(100%-1.5rem)] truncate bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">{label}</span>
              <input name={name} value={filters[name]} onChange={update} placeholder={label} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold outline-none focus:border-blue-500" />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E88E5] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-blue-700"><Search size={14} /> Search payout</button>
          <button type="button" onClick={reset} className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-50">Reset</button>
        </div>
      </form>

      <ReusableTable
        title="Payout Grid Results"
        subtitle="Commission rules matching the selected vehicle criteria"
        rows={report.rows}
        columns={columns}
        loading={loading}
        error={error}
        emptyMessage="No payout rules match the selected criteria."
        onExport={(rows) => exportPayoutReport(rows)}
        exportLabel="Export payout report"
        pageSize={20}
        pageSizeOptions={[20, 50, 100]}
      />

      {selected && (
        <section className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800">Applicability details · {selected.company}</h2>
            <button type="button" onClick={() => setExpandedId(null)} className="text-xs font-bold text-slate-500">Close</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {remarks.map(([label, key]) => (
              <div key={key} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="mt-1 whitespace-pre-wrap text-xs font-semibold text-slate-700">{key === "rto" ? selected.rto || "All" : selected.remarks?.[key] || "N/A"}</p>
              </div>
            ))}
          </div>
          {Object.values(selected.matched_filters || {}).some(Boolean) && (
            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-blue-600">Search profile matched</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(selected.matched_filters).filter(([, value]) => value).map(([key, value]) => (
                  <span key={key} className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                    {key.replaceAll("_", " ")}: {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
