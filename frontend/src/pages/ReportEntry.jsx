import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import * as XLSX from "xlsx";
import axiosInstance from "../config/axios";
import MonthYearPicker from "./reusable/MonthYearPicker";

const PAGE_SIZE = 10;

export const REPORT_COLUMNS = [
  { key: "bqp_display", label: "BQP" },
  { key: "reporting_manager_display", label: "Reporting Manager" },
  { key: "relationship_manager_display", label: "Relationship Manager" },
  { key: "pos_display", label: "POS" },
  { key: "reference_display", label: "Reference" },
  { key: "business_type", label: "Business Type" },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "office_name", label: "Office Address" },
  { key: "policy_number", label: "Policy Number" },
  { key: "policy_type", label: "Policy Type" },
  { key: "vehicle_category", label: "Vehicle Category" },
  { key: "insured_name", label: "Insured Name" },
  { key: "pan", label: "PAN" },
  { key: "gstin", label: "GSTIN" },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "od_expiry", label: "OD Expiry", type: "date" },
  { key: "tp_expiry", label: "TP Expiry", type: "date" },
  { key: "issue_date", label: "Issue Date", type: "date" },
  { key: "idv", label: "IDV", type: "currency" },
  { key: "previous_insurer", label: "Previous Insurer" },
  { key: "previous_policy", label: "Previous Policy" },
  { key: "total_od", label: "Total OD", type: "currency" },
  { key: "total_tp", label: "Total TP", type: "currency" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "gst", label: "GST", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  { key: "registration_number", label: "Registration Number" },
  { key: "manufacturing_year", label: "Manufacturing Year" },
  { key: "chassis_number", label: "Chassis Number" },
  { key: "engine_number", label: "Engine Number" },
  { key: "body_type", label: "Body Type" },
  { key: "fuel", label: "Fuel" },
  { key: "commercial_vehicle_type", label: "Commercial Vehicle Type" },
  { key: "sub_type", label: "Sub Type" },
  { key: "gvw", label: "GVW" },
  { key: "make_name", label: "Make" },
  { key: "cc", label: "CC" },
  { key: "model_name", label: "Model" },
  { key: "seating_capacity", label: "Seating Capacity" },
  { key: "variant_name", label: "Variant" },
  { key: "financier", label: "Financier" },
  { key: "irda_od", label: "IRDA OD" },
  { key: "irda_tp", label: "IRDA TP" },
  { key: "irda_net", label: "IRDA Net" },
  { key: "pos_od", label: "POS OD" },
  { key: "pos_tp", label: "POS TP" },
  { key: "pos_net", label: "POS Net" },
];

export const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date).replaceAll("/", "-");
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

export const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(date);
};

export const displayValue = (policy, column) => {
  const value = policy[column.key];
  if (column.type === "date") return formatDate(value);
  if (column.type === "datetime") return formatDateTime(value);
  if (column.type === "currency") return formatCurrency(value);
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

export default function ReportEntry() {
  const today = new Date();
  
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  
  const [lob, setLob] = useState("All LOBs");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/policies/report/monthly", {
        params: { month, year },
      });
      setPolicies(response.data?.data?.policies || []);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to load policy report.";
      setError(message);
      setPolicies([]);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    setCurrentPage(1);
  }, [month, year, lob, search]);

  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)),
    [month, year],
  );

  const lobOptions = useMemo(() => {
    const values = new Set(policies.map(() => "Motor"));
    return ["All LOBs", ...values];
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    const query = search.trim().toLowerCase();
    return policies.filter((policy) => {
      if (lob !== "All LOBs" && lob !== "Motor") return false;
      if (!query) return true;
      return REPORT_COLUMNS.some(({ key }) =>
        String(policy[key] ?? "").toLowerCase().includes(query),
      );
    });
  }, [policies, lob, search]);

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pagePolicies = filteredPolicies.slice(pageStart, pageStart + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  const exportExcel = () => {
    if (!filteredPolicies.length) {
      toast.error("No policy records available to export.");
      return;
    }

    const rows = filteredPolicies.map((policy, index) => {
      const row = { "Sr. No.": index + 1 };
      REPORT_COLUMNS.forEach((column) => {
        const value = policy[column.key];
        row[column.label] = column.type === "date"
          ? formatDate(value)
          : column.type === "datetime"
            ? formatDateTime(value)
            : value ?? "N/A";
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((heading) => ({
      wch: Math.min(45, Math.max(14, heading.length + 3)),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Policy Report");
    const filename = `Policies_Report_${monthTitle.replaceAll(" ", "_")}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success(`${filename} downloaded successfully.`);
  };

  return (
    <main className="report-dashboard mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <style>{`
        .report-dashboard { font-family: Arial, sans-serif; }
        .report-dashboard button, .report-dashboard select, .report-dashboard input,
        .report-dashboard th { font-family: Arial, sans-serif; }
        .report-dashboard thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8fafc;
        }
        .report-dashboard thead {
          z-index: 10;
        }
        /* Ensure the table wrapper allows horizontal scroll */
        .report-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <Toaster position="top-right" />

      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <header className="bg-[#1E88E5] px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white shadow-sm sm:px-5 sm:py-4 sm:text-sm">
          Policies Report
        </header>

        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/20 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            {/* MonthYearPicker */}
            <div className="w-full sm:w-auto">
              <MonthYearPicker 
                month={month} 
                year={year} 
                onChange={(newMonth, newYear) => {
                  setMonth(newMonth);
                  setYear(newYear);
                }} 
              />
            </div>

            <label className="flex w-full flex-col sm:w-44">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">LOB Type</span>
              <select 
                value={lob} 
                onChange={(event) => setLob(event.target.value)} 
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 sm:w-44"
              >
                {lobOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>

            <label className="flex w-full flex-col sm:w-64">
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Search</span>
              <span className="relative">
                <input 
                  value={search} 
                  onChange={(event) => setSearch(event.target.value)} 
                  placeholder="Search client / policy / type" 
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 sm:w-64" 
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </span>
            </label>
          </div>

          <button 
            type="button" 
            onClick={exportExcel} 
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#121212] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#252525] sm:w-auto"
          >
            <Download size={12} /> Export Excel
          </button>
        </div>

        <div className="border-b border-slate-100/50 bg-slate-50/10 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-6 sm:py-4">
          Showing {filteredPolicies.length} of {policies.length} policies ({monthTitle})
        </div>

        {error && (
          <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:mx-4">
            {error}
          </div>
        )}

        <div className="report-table-wrapper flex-1">
          <table className="w-max min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3">Sr. No.</th>
                {REPORT_COLUMNS.map((column) => (
                  <th key={column.key} className="whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={REPORT_COLUMNS.length + 1} className="py-10 text-center text-xs font-semibold text-slate-400">
                    Loading complete policy report...
                  </td>
                </tr>
              ) : pagePolicies.length ? (
                pagePolicies.map((policy, index) => (
                  <tr key={policy.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-2 py-2 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-3">
                      {pageStart + index + 1}
                    </td>
                    {REPORT_COLUMNS.map((column) => {
                      const value = displayValue(policy, column);
                      const isLongText = ["address", "verify_remark", "account_remark"].includes(column.key);
                      return (
                        <td
                          key={column.key}
                          title={value}
                          className={`whitespace-nowrap px-2 py-2 text-[10px] font-semibold sm:px-3 sm:py-3 ${
                            column.key === "policy_number" ? "text-blue-600" : "text-slate-700"
                          } ${isLongText ? "max-w-[200px] truncate sm:max-w-[300px]" : ""}`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={REPORT_COLUMNS.length + 1} className="bg-slate-50/5 py-10 text-center text-xs font-semibold italic text-slate-400">
                    No matching policies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white p-3 text-[11px] font-bold text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <div className="text-center sm:text-left">
            Page {safePage} of {totalPages} — Showing {filteredPolicies.length ? pageStart + 1 : 0}-
            {Math.min(pageStart + PAGE_SIZE, filteredPolicies.length)} of {filteredPolicies.length} records
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button 
              type="button" 
              disabled={safePage === 1} 
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} 
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {pageNumbers.map((page) => (
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
            ))}
            <button 
              type="button" 
              disabled={safePage === totalPages} 
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} 
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}