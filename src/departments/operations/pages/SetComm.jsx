import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axiosInstance from "../../../config/axios";
import MonthYearPicker from "../../../pages/reusable/MonthYearPicker";
import ReusableTable from "../../../components/reusable/ReusableTable";

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
  { key: "pos_net", label: "POS Net (%)" },
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

const calculateTotalGiven = (policy, commission = policy) =>
  (Number(policy.total_od || 0) * Number(commission.pos_od || 0)) / 100 +
  (Number(policy.total_tp || 0) * Number(commission.pos_tp || 0)) / 100 +
  (Number(policy.net_premium || 0) * Number(commission.pos_net || 0)) / 100;

// ---------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------
export default function SetComm() {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPos, setSelectedPos] = useState("");
  const [selectedInsurer, setSelectedInsurer] = useState("");
  const [posOptions, setPosOptions] = useState([]);
  const [insurerOptions, setInsurerOptions] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [policies, setPolicies] = useState([]);
  const [visibility, setVisibility] = useState("self");
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [totalGivenInputs, setTotalGivenInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState({});
  const [error, setError] = useState("");

  const saveTimers = useRef({});
  const pendingDrafts = useRef({});
  const lastSavedDrafts = useRef({});

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(
        new Date(selectedYear, selectedMonth - 1, 1)
      ),
    [selectedMonth, selectedYear]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch policies
  const fetchPolicies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get("/setcomm", {
        params: {
          page,
          limit: pageSize,
          month: selectedMonth,
          year: selectedYear,
          search: debouncedSearch,
          pos_id: selectedPos,
          insurance_company: selectedInsurer,
          sortBy: "issue_date",
          sortOrder: "DESC",
        },
      });
      const data = response.data?.data || {};
      const rows = data.rows || [];
      setPolicies(rows);
      setVisibility(data.visibility || "self");
      setPosOptions([
        { value: "", label: "All POS" },
        ...(data.posOptions || []).map((option) => ({ value: option.value, label: option.label })),
      ]);
      setInsurerOptions([
        { value: "", label: "All Insurers" },
        ...(data.insurers || []).map((companyName) => ({ value: companyName, label: companyName })),
      ]);
      setTotal(data.total || 0);
      setPages(Math.max(1, data.pages || 1));
      const loadedDrafts = Object.fromEntries(
        rows.map((policy) => [policy.id, createCommissionDraft(policy)])
      );
      setDrafts(loadedDrafts);
      setTotalGivenInputs(Object.fromEntries(
        rows.map((policy) => [policy.id, calculateTotalGiven(policy, loadedDrafts[policy.id]).toFixed(2)])
      ));
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
  }, [page, pageSize, selectedMonth, selectedYear, debouncedSearch, selectedPos, selectedInsurer]);

  useEffect(() => {
    // Synchronize the controlled table with the commission API query.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPolicies();
  }, [fetchPolicies]);

  // Cleanup timers
  useEffect(() => () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
  }, []);

  // Handle commission input change
  const handleCommissionChange = (policyId, field, value, { syncTotalGiven = true } = {}) => {
    const nextDraft = { ...drafts[policyId], [field]: value };
    pendingDrafts.current[policyId] = nextDraft;
    setDrafts((current) => ({ ...current, [policyId]: nextDraft }));
    if (syncTotalGiven) {
      const policy = policies.find((item) => item.id === policyId);
      if (policy) {
        setTotalGivenInputs((current) => ({
          ...current,
          [policyId]: calculateTotalGiven(policy, nextDraft).toFixed(2),
        }));
      }
    }
    setSaveStatus((current) => ({ ...current, [policyId]: "pending" }));

    clearTimeout(saveTimers.current[policyId]);
    saveTimers.current[policyId] = setTimeout(() => {
      persistCommission(policyId, pendingDrafts.current[policyId]);
    }, 700);
  };

  const handleTotalGivenChange = (policy, value) => {
    setTotalGivenInputs((current) => ({ ...current, [policy.id]: value }));
    if (value === "") return;

    const targetTotal = Number(value);
    const netPremium = Number(policy.net_premium || 0);
    const draft = drafts[policy.id] || createCommissionDraft(policy);
    const odContribution = (Number(policy.total_od || 0) * Number(draft.pos_od || 0)) / 100;
    const tpContribution = (Number(policy.total_tp || 0) * Number(draft.pos_tp || 0)) / 100;
    const remainingForNet = targetTotal - odContribution - tpContribution;

    if (!Number.isFinite(targetTotal) || targetTotal < 0 || netPremium <= 0 || remainingForNet < 0) {
      setSaveStatus((current) => ({ ...current, [policy.id]: "error" }));
      return;
    }

    const calculatedPosNet = (remainingForNet * 100) / netPremium;
    handleCommissionChange(policy.id, "pos_net", calculatedPosNet.toFixed(2), { syncTotalGiven: false });
  };

  const handleTotalGivenBlur = (policy) => {
    const value = totalGivenInputs[policy.id];
    const draft = pendingDrafts.current[policy.id] || drafts[policy.id] || createCommissionDraft(policy);
    if (value === "" || saveStatus[policy.id] === "error") {
      setTotalGivenInputs((current) => ({
        ...current,
        [policy.id]: calculateTotalGiven(policy, draft).toFixed(2),
      }));
      if (Number(policy.net_premium || 0) <= 0) toast.error("Net Premium must be greater than zero to reverse-calculate POS Net %.");
      else toast.error("Total Given cannot be lower than the POS OD and POS TP contribution.");
      return;
    }
    saveOnBlur(policy.id);
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
      await axiosInstance.put(`/setcomm/${policyId}`, payload);
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

  const tableColumns = [
    ...REPORT_COLUMNS.map((column) => {
      const isCommission = COMMISSION_FIELDS.has(column.key);
      const isTotalGiven = column.key === "total_given";
      return {
        ...column,
        headerClassName: `sticky top-0 z-20 whitespace-nowrap px-2 py-2 text-[10px] font-bold uppercase tracking-wider shadow-[0_1px_0_#e2e8f0] sm:px-3 sm:py-3 ${isCommission ? "bg-blue-50 text-blue-700" : isTotalGiven ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-500"}`,
        cellClassName: isCommission
          ? "bg-blue-50/30 px-1 py-1 sm:px-2 sm:py-2"
          : `whitespace-nowrap px-2 py-2 text-[10px] font-semibold sm:px-3 sm:py-3 ${isTotalGiven ? "text-emerald-700" : column.key === "policy_number" ? "text-blue-600" : "text-slate-700"}`,
        render: (_, policy) => {
          const draft = drafts[policy.id] || {};
          const merged = { ...policy, ...draft };
          if (isTotalGiven) {
            return (
              <span className="relative inline-flex items-center">
                <span className="pointer-events-none absolute left-2 text-[10px] font-bold text-emerald-600">₹</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalGivenInputs[policy.id] ?? calculateTotalGiven(policy, merged).toFixed(2)}
                  onChange={(event) => handleTotalGivenChange(policy, event.target.value)}
                  onBlur={() => handleTotalGivenBlur(policy)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  title="Enter Total Given to reverse-calculate POS Net percentage"
                  className="h-7 w-24 rounded-lg border border-emerald-200 bg-white pl-5 pr-2 text-right text-[10px] font-bold text-emerald-700 outline-none transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:h-8 sm:w-28 sm:text-[11px]"
                />
              </span>
            );
          }
          if (isCommission) {
            const showPercent = column.key === "pos_net";
            return (
              <span className="relative inline-flex items-center">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft[column.key] ?? "0.00"}
                  onChange={(event) => handleCommissionChange(policy.id, column.key, event.target.value)}
                  onBlur={() => saveOnBlur(policy.id)}
                  onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                  className={`h-7 w-20 min-w-[60px] rounded-lg border border-blue-200 bg-white px-1 text-right text-[10px] font-bold text-blue-800 outline-none transition hover:border-blue-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-100 sm:h-8 sm:w-28 sm:min-w-[112px] sm:px-2 sm:text-[11px] ${showPercent ? "pr-5 sm:pr-6" : ""}`}
                />
                {showPercent && <span className="pointer-events-none absolute right-2 text-[10px] font-black text-blue-500">%</span>}
              </span>
            );
          }
          return displayValue(policy, column);
        },
      };
    }),
    {
      key: "auto_save",
      label: "Auto Save",
      headerClassName: "sticky right-0 top-0 z-[30] whitespace-nowrap bg-slate-100 px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[-1px_0_0_#e2e8f0] sm:px-3 sm:py-3",
      cellClassName: "sticky right-0 z-10 bg-slate-50 px-2 py-2 text-center shadow-[-1px_0_0_#f1f5f9] sm:px-3 sm:py-3",
      render: (_, policy) => {
        const status = saveStatus[policy.id];
        return (
          <span className={`inline-flex min-w-[60px] justify-center rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider sm:min-w-16 sm:px-2 sm:py-1 sm:text-[10px] ${status === "saved" ? "bg-emerald-50 text-emerald-700" : status === "error" ? "bg-red-50 text-red-700" : status === "saving" ? "bg-blue-50 text-blue-700" : status === "pending" ? "bg-amber-50 text-amber-700" : "border border-slate-200 bg-white text-slate-400"}`}>
            {status === "saved" ? "Saved" : status === "error" ? "Error" : status === "saving" ? "Saving" : status === "pending" ? "Wait" : "Ready"}
          </span>
        );
      },
    },
  ];

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

      <ReusableTable
        title={`Policies Commission Report · ${visibility === "all" ? "All Employees" : "My Data"}`}
        subtitle="Enter Total Given to reverse-calculate POS Net %; commission values save automatically"
        headerAction={
          <button
            type="button"
            onClick={fetchPolicies}
            disabled={loading}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/20 disabled:opacity-50"
            title="Refresh policies"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        }
        rows={policies}
        columns={tableColumns}
        filters={[
          {
            name: "commission-period",
            render: (
              <MonthYearPicker
                month={selectedMonth}
                year={selectedYear}
                onChange={(newMonth, newYear) => {
                  setSelectedMonth(newMonth);
                  setSelectedYear(newYear);
                  setSelectedPos("");
                  setSelectedInsurer("");
                  setPage(1);
                }}
              />
            ),
          },
          {
            name: "pos",
            label: "POS",
            value: selectedPos,
            options: posOptions,
            onChange: (event) => {
              setSelectedPos(event.target.value);
              setPage(1);
            },
          },
          {
            name: "insurer",
            label: "Insurer",
            value: selectedInsurer,
            options: insurerOptions,
            onChange: (event) => {
              setSelectedInsurer(event.target.value);
              setPage(1);
            },
          },
        ]}
        searchConfig={{
          value: search,
          onChange: (event) => setSearch(event.target.value),
          placeholder: "Policy, insured, insurer, POS, vehicle...",
          clientSide: false,
        }}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 25, 50]}
        pagination={{
          page,
          pageSize,
          pages,
          total,
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
        recordLabel="policies"
        countSuffix={monthTitle}
        loading={loading}
        loadingMessage="Loading complete policy commission report..."
        error={error}
        emptyMessage="No policies found for the selected criteria."
        serialHeaderClassName="sticky left-0 top-0 z-[30] whitespace-nowrap bg-slate-100 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[1px_0_0_#e2e8f0] sm:px-3 sm:py-3"
        serialCellClassName="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-2 py-2 text-[10px] font-bold text-slate-500 shadow-[1px_0_0_#f1f5f9] sm:px-3 sm:py-3"
      />
    </main>
  );
}
