import React, { useState, useMemo, useEffect } from "react";
import { Download, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import axiosInstance from "../config/axios";
import MonthYearPicker from "./reusable/MonthYearPicker";

const PAGE_SIZE = 10;

const formatApiDate = (val) => {
  if (!val) return "N/A";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "N/A" : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d).replaceAll("/", "-");
};

const formatCurrency = (val) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(val) || 0);

// Single source of truth for Table rendering, Searching, and Excel Export
const COLUMNS = [
  { label: "Policy No", key: "policy_number", cls: "font-bold text-blue-600 select-all" },
  { label: "Client Name", key: "insured_name", cls: "font-extrabold uppercase text-slate-800 max-w-[200px] truncate" },
  { label: "Relationship Manager", key: "relationship_manager_display" },
  { label: "POS", key: "pos_display" },
  { label: "Reference", key: "reference_display" },
  { label: "Insurer", key: "insurance_company", cls: "max-w-[200px] truncate" },
  { label: "LOB", val: () => "Motor", cls: "font-bold text-slate-700" },
  { label: "Category", key: "vehicle_category" },
  { label: "Product Type", key: "policy_type" },
  { label: "IDV / Sum Insured", val: (p) => Number(p.idv || 0).toLocaleString(), cls: "font-bold text-slate-700" },
  { label: "OD Premium", val: (p) => formatCurrency(p.total_od), cls: "font-bold text-slate-700" },
  { label: "TP Premium", val: (p) => formatCurrency(p.total_tp), cls: "font-bold text-slate-700" },
  { label: "NET Premium", val: (p) => formatCurrency(p.net_premium), cls: "font-extrabold text-slate-800" },
  { label: "Issue Date", key: "issue_date", isDate: true },
  { label: "Start Date", key: "start_date", isDate: true },
  { label: "OD Expiry Date", key: "od_expiry", isDate: true },
  { label: "TP Expiry Date", key: "tp_expiry", isDate: true },
  { label: "Registration Date", val: () => "N/A" },
  { label: "Vehicle No", key: "registration_number", cls: "font-bold text-slate-700" },
  { label: "Engine No / Chasis No", val: (p) => [p.engine_number, p.chassis_number].filter(Boolean).join(" / ") },
  { label: "Contact", key: "contact" },
  { label: "Address", key: "address", cls: "max-w-[280px] truncate" },
  { label: "City / State", val: () => "N/A", cls: "font-bold text-slate-700" },
  { label: "Pin Code", val: () => "N/A", cls: "font-bold text-slate-700" },
];

const getVal = (policy, col) => col.val ? col.val(policy) : (col.isDate ? formatApiDate(policy[col.key]) : (policy[col.key] || "N/A"));

export default function Renewals() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [filterLOB, setFilterLOB] = useState("All LOBs");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRenewals = async () => {
      setLoading(true); setError("");
      try {
        const { data } = await axiosInstance.get("/policies/report/renewals", { params: { year, month } });
        setPolicies(data?.data?.policies || []);
      } catch (err) {
        const msg = err.response?.data?.message || "Unable to load renewal policies.";
        setError(msg); setPolicies([]); toast.error(msg);
      } finally { setLoading(false); }
    };
    fetchRenewals();
  }, [month, year]);

  const lobOptions = useMemo(() => policies.length ? ["All LOBs", "Motor"] : ["All LOBs"], [policies]);

  useEffect(() => {
    if (!lobOptions.includes(filterLOB)) setFilterLOB("All LOBs");
  }, [lobOptions, filterLOB]);

  const filteredPolicies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return policies.filter((p) => {
      if (filterLOB !== "All LOBs" && filterLOB !== "Motor") return false;
      if (!query) return true;
      return COLUMNS.some((col) => String(getVal(p, col)).toLowerCase().includes(query));
    });
  }, [policies, filterLOB, searchQuery]);

  useEffect(() => setCurrentPage(1), [month, year, filterLOB, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const paginatedPolicies = filteredPolicies.slice(pageStart, pageStart + PAGE_SIZE);

  const formatHeaderMonth = useMemo(() => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)), [month, year]);

  const handleExportExcel = () => {
    if (!filteredPolicies.length) return toast.error("No policy records available to export.");

    const rows = filteredPolicies.map((p, idx) => {
      const row = { "Sr. No.": idx + 1 };
      COLUMNS.forEach(col => row[col.label] = getVal(p, col));
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map(h => ({ wch: Math.min(Math.max(h.length, 10) + 3, 40) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Renewal Report");
    
    const filename = `Policies_Renewal_Report_${formatHeaderMonth.replace(/\s+/g, "_")}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success(`Report "${filename}" downloaded successfully!`);
  };

  return (
    <main className="renewals-dashboard mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <style>{`
        .renewals-dashboard, .renewals-dashboard button, .renewals-dashboard select, .renewals-dashboard input, .renewals-dashboard th { font-family: Arial, sans-serif; }
        .renewals-dashboard thead th { position: sticky; top: 0; z-index: 10; background-color: #f8fafc; }
        .renewals-dashboard thead { z-index: 10; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      <Toaster position="top-right" />

      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        
        <header className="bg-[#1E88E5] px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-sm sm:px-5 sm:py-4 sm:text-sm">
          Policies Renewal Report
        </header>

        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/20 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            <div className="w-full sm:w-auto">
              <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            </div>

            <label className="flex w-full flex-col sm:w-44">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">LOB Type</span>
              <select 
                value={filterLOB} 
                onChange={(e) => setFilterLOB(e.target.value)} 
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300 sm:w-44"
              >
                {lobOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </label>

            <label className="flex w-full flex-col sm:w-64">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Search</span>
              <span className="relative">
                <input 
                  type="text" 
                  placeholder="Search client / policy / type" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300 sm:w-64" 
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </span>
            </label>
          </div>

          <button 
            type="button" 
            onClick={handleExportExcel} 
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-[#121212] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#252525] sm:w-auto"
          >
            <Download size={12} /> Export Excel
          </button>
        </div>

        <div className="border-b border-slate-100/50 bg-slate-50/10 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-6 sm:py-4">
          Showing {filteredPolicies.length} of {policies.length} policies ({formatHeaderMonth})
        </div>

        {error && <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:mx-4">{error}</div>}

        <div className="table-wrapper flex-1">
          <table className="w-max min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3">Sr. No.</th>
                {COLUMNS.map(col => (
                  <th key={col.label} className="whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={COLUMNS.length + 1} className="py-10 text-center text-xs font-semibold text-slate-400">Loading renewal policies...</td></tr>
              ) : paginatedPolicies.length > 0 ? (
                paginatedPolicies.map((p, idx) => (
                  <tr key={p.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-2 py-2 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-3">{pageStart + idx + 1}</td>
                    {COLUMNS.map(col => {
                      const val = getVal(p, col);
                      return (
                        <td 
                          key={col.label} 
                          title={val} 
                          className={`px-2 py-2 text-[10px] sm:px-3 sm:py-3 ${col.cls || "whitespace-nowrap font-semibold text-slate-600"}`}
                        >
                          {val}
                        </td>
                      )
                    })}
                  </tr>
                ))
              ) : (
                <tr><td colSpan={COLUMNS.length + 1} className="bg-slate-50/5 py-10 text-center text-xs font-semibold italic text-slate-400">No matching policies found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white p-3 text-[11px] font-bold text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <div className="text-center sm:text-left">
            Page {safePage} of {totalPages} — Showing {filteredPolicies.length ? pageStart + 1 : 0}-{Math.min(pageStart + PAGE_SIZE, filteredPolicies.length)} of {filteredPolicies.length} records
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button 
              type="button" 
              disabled={safePage === 1} 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              const page = Math.max(1, Math.min(safePage - 2, totalPages - 4)) + index;
              return (
                <button 
                  key={page} 
                  type="button" 
                  onClick={() => setCurrentPage(page)} 
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${
                    safePage === page 
                      ? "bg-[#1E88E5] text-white shadow-sm" 
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button 
              type="button" 
              disabled={safePage === totalPages} 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}