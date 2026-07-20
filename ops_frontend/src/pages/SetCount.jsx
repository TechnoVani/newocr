import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../config/axios";
import MonthYearPicker from "./reusable/MonthYearPicker";

// ---------------------------------------------------------------------
// Helper functions (copied from ReportEntry to keep self-contained)
// ---------------------------------------------------------------------
const formatDate = (value) => {
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
};

const displayValue = (policy, column) => {
  const value = policy[column.key];
  if (column.type === "date") return formatDate(value);
  if (column.type === "datetime") return formatDateTime(value);
  if (column.type === "currency") return formatCurrency(value);
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

// ---------------------------------------------------------------------
// Column definitions – added "total_given" after "pos_net"
// ---------------------------------------------------------------------
const REPORT_COLUMNS = [
  { key: "relationship_manager_display", label: "Relationship Manager" },
  { key: "pos_display", label: "POS" },
  { key: "reference_display", label: "Reference" },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "policy_number", label: "Policy Number" },
  { key: "policy_type", label: "Policy Type" },
  { key: "vehicle_category", label: "Vehicle Category" },
  { key: "insured_name", label: "Insured Name" },
  { key: "total_od", label: "Total OD", type: "currency" },
  { key: "total_tp", label: "Total TP", type: "currency" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "gst", label: "GST", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  { key: "registration_number", label: "Registration Number" },
  { key: "manufacturing_year", label: "Manufacturing Year" },
  { key: "chassis_number", label: "Chassis Number" },
  { key: "engine_number", label: "Engine Number" },
  { key: "commercial_vehicle_type", label: "Commercial Vehicle Type" },
  { key: "sub_type", label: "Sub Type" },
  { key: "gvw", label: "GVW" },
  { key: "make_name", label: "Make" },
  { key: "cc", label: "CC" },
  { key: "model_name", label: "Model" },
  { key: "variant_name", label: "Variant" },
  { key: "irda_od", label: "IRDA OD" },
  { key: "irda_tp", label: "IRDA TP" },
  { key: "irda_net", label: "IRDA Net" },
  { key: "pos_od", label: "POS OD" },
  { key: "pos_tp", label: "POS TP" },
  { key: "pos_net", label: "POS Net" },
  // ✅ New computed column
  { key: "total_given", label: "Total Given", type: "currency", computed: true },
];

// Fields that are editable (commission inputs)
const COMMISSION_FIELDS = new Set([
  "irda_od",
  "irda_tp",
  "irda_net",
  "pos_od",
  "pos_tp",
  "pos_net",
]);

const createCommissionDraft = (policy) =>
  Object.fromEntries(
    [...COMMISSION_FIELDS].map((field) => [field, policy[field] ?? "0.00"]),
  );

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
export default function SetComm() {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [policies, setPolicies] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({});
  const [error, setError] = useState("");

  const saveTimers = useRef({});
  const pendingDrafts = useRef({});
  const lastSavedDrafts = useRef({});

  const formattedApiMonth = useMemo(() => {
    return `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
  }, [selectedMonth, selectedYear]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
        new Date(selectedYear, selectedMonth - 1, 1)
      ),
    [selectedMonth, selectedYear]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [formattedApiMonth, debouncedSearch, pageSize]);

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/setcount", {
        params: {
          page,
          limit: pageSize,
          month: formattedApiMonth,
          search: debouncedSearch,
          sortBy: "issue_date",
          sortOrder: "DESC",
        },
      });
      const data = response.data?.data || {};
      const rows = data.rows || [];
      setPolicies(rows);
      setTotal(data.total || 0);
      setPages(Math.max(1, data.pages || 1));
      const loadedDrafts = Object.fromEntries(
        rows.map((policy) => [policy.id, createCommissionDraft(policy)])
      );
      setDrafts(loadedDrafts);
      lastSavedDrafts.current = Object.fromEntries(
        Object.entries(loadedDrafts).map(([id, draft]) => [id, JSON.stringify(draft)])
      );
      setSaveStatus({});
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to load policy commission report.";
      setPolicies([]);
      setTotal(0);
      setPages(1);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, formattedApiMonth, debouncedSearch]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // Cleanup timers
  useEffect(() => () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
  }, []);

  // Handle commission input change
  const handleCommissionChange = (policyId, field, value) => {
    const nextDraft = { ...drafts[policyId], [field]: value };
    pendingDrafts.current[policyId] = nextDraft;
    setDrafts((current) => ({ ...current, [policyId]: nextDraft }));
    setSaveStatus((current) => ({ ...current, [policyId]: "pending" }));

    clearTimeout(saveTimers.current[policyId]);
    saveTimers.current[policyId] = setTimeout(() => {
      persistCommission(policyId, pendingDrafts.current[policyId]);
    }, 700);
  };

  // Persist commission to backend
  const persistCommission = async (policyId, draft) => {
    if (!draft) return;
    const signature = JSON.stringify(draft);
    if (lastSavedDrafts.current[policyId] === signature) {
      setSaveStatus((current) => ({ ...current, [policyId]: "saved" }));
      return;
    }

    const payload = {};
    for (const field of COMMISSION_FIELDS) {
      const amount = Number(draft[field]);
      if (!Number.isFinite(amount) || amount < 0) {
        setSaveStatus((current) => ({ ...current, [policyId]: "error" }));
        toast.error(`${field.replaceAll("_", " ").toUpperCase()} must be a positive number.`);
        return;
      }
      payload[field] = Number(amount.toFixed(2));
    }

    setSaveStatus((current) => ({ ...current, [policyId]: "saving" }));
    try {
      await axiosInstance.put(`/setcount/${policyId}`, payload);
      setPolicies((current) =>
        current.map((policy) =>
          policy.id === policyId ? { ...policy, ...payload } : policy
        )
      );
      lastSavedDrafts.current[policyId] = signature;
      setSaveStatus((current) => ({ ...current, [policyId]: "saved" }));
    } catch (requestError) {
      setSaveStatus((current) => ({ ...current, [policyId]: "error" }));
      toast.error(requestError.response?.data?.message || "Unable to save policy commission.");
    }
  };

  const saveOnBlur = (policyId) => {
    clearTimeout(saveTimers.current[policyId]);
    persistCommission(policyId, pendingDrafts.current[policyId] || drafts[policyId]);
  };

  // Pagination helpers
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, pages]);

  const firstRecord = total ? (page - 1) * pageSize + 1 : 0;
  const lastRecord = Math.min(page * pageSize, total);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <main className="setcomm-dashboard mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <style>{`
        .setcomm-dashboard { font-family: Arial, sans-serif; }
        .setcomm-dashboard button, .setcomm-dashboard select, .setcomm-dashboard input,
        .setcomm-dashboard th { font-family: Arial, sans-serif; }
        .setcomm-dashboard thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8fafc;
        }
        .setcomm-dashboard thead { z-index: 10; }
        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <Toaster position="top-right" />

      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-2 bg-[#1E88E5] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:px-5 sm:py-4">
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-xs font-bold uppercase tracking-wider sm:text-sm">
              Policies Commission Report
            </h1>
            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-100 sm:text-[9px]">
              IRDA and POS values save automatically while you type
            </p>
          </div>
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
            title="Refresh policies"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </header>

        {/* Filter bar */}
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/20 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
            <div className="w-full sm:w-auto">
              <MonthYearPicker
                month={selectedMonth}
                year={selectedYear}
                onChange={(newMonth, newYear) => {
                  setSelectedMonth(newMonth);
                  setSelectedYear(newYear);
                }}
              />
            </div>

            <label className="flex w-full flex-col sm:w-72">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Search Complete Data
              </span>
              <span className="relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Policy, insured, POS, vehicle..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300 sm:w-72"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              </span>
            </label>

            <label className="flex w-full flex-col sm:w-24">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Rows
              </span>
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 hover:border-slate-300 sm:w-24"
              >
                {[5, 10, 25, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Count row */}
        <div className="border-b border-slate-100/50 bg-slate-50/10 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-6 sm:py-4">
          Showing {policies.length} of {total} policies ({monthTitle})
        </div>

        {error && (
          <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:mx-4">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="table-wrapper flex-1 bg-slate-50/30">
          <table className="w-max min-w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="sticky left-0 z-[30] whitespace-nowrap bg-slate-100 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[1px_0_0_#e2e8f0] sm:px-3 sm:py-3">
                  Sr. No.
                </th>
                {REPORT_COLUMNS.map((column) => {
                  const isCommission = COMMISSION_FIELDS.has(column.key);
                  const isTotalGiven = column.key === "total_given";
                  return (
                    <th
                      key={column.key}
                      className={`whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider shadow-[0_1px_0_#e2e8f0] sm:px-3 sm:py-3 ${
                        isCommission
                          ? "bg-blue-50 text-blue-700"
                          : isTotalGiven
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-500"
                      }`}
                    >
                      {column.label}
                    </th>
                  );
                })}
                <th className="sticky right-0 z-[30] bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[-1px_0_0_#e2e8f0] sm:px-3 sm:py-3">
                  Auto Save
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={REPORT_COLUMNS.length + 2} className="py-16 text-center text-xs font-semibold text-slate-400">
                    Loading complete policy commission report...
                  </td>
                </tr>
              ) : policies.length ? (
                policies.map((policy, index) => {
                  // Get current draft (with user edits) or fallback to policy
                  const draft = drafts[policy.id] || {};
                  // Merge draft over policy for real‑time values (except computed fields)
                  const merged = { ...policy, ...draft };

                  return (
                    <tr key={policy.id} className="transition-colors hover:bg-slate-50/50">
                      {/* Sr. No. */}
                      <td className="sticky left-0 z-10 bg-slate-50 px-2 py-2 text-[10px] font-bold text-slate-500 shadow-[1px_0_0_#f1f5f9] sm:px-3 sm:py-3">
                        {(page - 1) * pageSize + index + 1}
                      </td>

                      {/* Columns */}
                      {REPORT_COLUMNS.map((column) => {
                        // --- Total Given (computed) ---
                        if (column.key === "total_given") {
                          const totalOd = Number(merged.total_od ?? 0);
                          const totalTp = Number(merged.total_tp ?? 0);
                          const netPremium = Number(merged.net_premium ?? 0);
                          const posOd = Number(merged.pos_od ?? 0);
                          const posTp = Number(merged.pos_tp ?? 0);
                          const posNet = Number(merged.pos_net ?? 0);

                          const totalGiven =
                            (totalOd * posOd) / 100 +
                            (totalTp * posTp) / 100 +
                            (netPremium * posNet) / 100;

                          return (
                            <td
                              key={column.key}
                              className="whitespace-nowrap px-2 py-2 text-[10px] font-semibold text-emerald-700 sm:px-3 sm:py-3"
                            >
                              {formatCurrency(totalGiven)}
                            </td>
                          );
                        }

                        // --- Editable commission fields ---
                        if (COMMISSION_FIELDS.has(column.key)) {
                          return (
                            <td key={column.key} className="bg-blue-50/30 px-1 py-1 sm:px-2 sm:py-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={draft[column.key] ?? "0.00"}
                                onChange={(event) =>
                                  handleCommissionChange(policy.id, column.key, event.target.value)
                                }
                                onBlur={() => saveOnBlur(policy.id)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") event.currentTarget.blur();
                                }}
                                className="h-7 w-20 min-w-[60px] rounded-lg border border-blue-200 bg-white px-1 text-right text-[10px] font-bold text-blue-800 outline-none transition focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-100 hover:border-blue-300 sm:h-8 sm:w-28 sm:min-w-[112px] sm:px-2 sm:text-[11px]"
                              />
                            </td>
                          );
                        }

                        // --- Normal display columns ---
                        const value = displayValue(policy, column);
                        const isLong = ["address", "verify_remark", "account_remark"].includes(column.key);
                        return (
                          <td
                            key={column.key}
                            title={value}
                            className={`whitespace-nowrap px-2 py-2 text-[10px] font-semibold sm:px-3 sm:py-3 ${
                              column.key === "policy_number" ? "text-blue-600" : "text-slate-700"
                            } ${isLong ? "max-w-[180px] truncate sm:max-w-[300px]" : ""}`}
                          >
                            {value}
                          </td>
                        );
                      })}

                      {/* Auto Save status */}
                      <td className="sticky right-0 z-10 bg-slate-50 px-2 py-2 text-center shadow-[-1px_0_0_#f1f5f9] sm:px-3 sm:py-3">
                        <span
                          className={`inline-flex min-w-[60px] justify-center rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider sm:min-w-16 sm:px-2 sm:py-1 sm:text-[10px] ${
                            saveStatus[policy.id] === "saved"
                              ? "bg-emerald-50 text-emerald-700"
                              : saveStatus[policy.id] === "error"
                              ? "bg-red-50 text-red-700"
                              : saveStatus[policy.id] === "saving"
                              ? "bg-blue-50 text-blue-700"
                              : saveStatus[policy.id] === "pending"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-white text-slate-400 border border-slate-200"
                          }`}
                        >
                          {saveStatus[policy.id] === "saved"
                            ? "Saved"
                            : saveStatus[policy.id] === "error"
                            ? "Error"
                            : saveStatus[policy.id] === "saving"
                            ? "Saving"
                            : saveStatus[policy.id] === "pending"
                            ? "Wait"
                            : "Ready"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={REPORT_COLUMNS.length + 2} className="py-16 text-center text-xs font-semibold text-slate-400">
                    No policies found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white p-3 text-[11px] font-bold text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
          <div className="text-center sm:text-left">
            Page {page} of {pages} — Showing {firstRecord}-{lastRecord} of {total} records
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[10px] font-bold transition ${
                  page === pageNumber
                    ? "bg-[#1E88E5] text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              disabled={page === pages}
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}