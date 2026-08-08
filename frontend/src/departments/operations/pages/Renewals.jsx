import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "../../../config/axios";
import ReusableTable from "../../../components/reusable/ReusableTable";
import { showApiError, showSuccess, showValidation } from "../../../utils/alert";

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
  { label: "Created By", key: "created_by_display" },
  { label: "Insurer", key: "insurance_company", cls: "max-w-[200px] truncate" },
  { label: "LOB", val: () => "Motor", cls: "font-bold text-slate-700" },
  { label: "Category", key: "categories" },
  { label: "Product Type", key: "product_type" },
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

const TABLE_COLUMNS = COLUMNS.map((column, index) => ({
  key: column.key || `computed_${index}`,
  label: column.label,
  searchValue: (policy) => getVal(policy, column),
  cellClassName: `px-2 py-2 text-[10px] sm:px-3 sm:py-3 ${column.cls || "whitespace-nowrap font-semibold text-slate-600"}`,
  render: (_, policy) => {
    const value = getVal(policy, column);
    return <span title={String(value)}>{value}</span>;
  },
}));

export default function Renewals() {
  const [filterPOS, setFilterPOS] = useState("All POS");

  const [policies, setPolicies] = useState([]);
  const [visibility, setVisibility] = useState("self");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRenewals = async () => {
      setLoading(true); setError("");
      try {
        const { data } = await axiosInstance.get("/policies/report/renewals", { params: { type: "upcoming" } });
        setPolicies(data?.data?.policies || []);
        setVisibility(data?.data?.visibility || "self");
      } catch (err) {
        const msg = err.response?.data?.message || "Unable to load renewal policies.";
        setError(msg); setPolicies([]); showApiError(err, msg);
      } finally { setLoading(false); }
    };
    fetchRenewals();
  }, []);

  const posOptions = useMemo(() => {
    const values = new Set(policies.map((policy) => String(policy.pos_display || "").trim()).filter(Boolean));
    return ["All POS", ...Array.from(values).sort((first, second) => first.localeCompare(second))];
  }, [policies]);

  const filteredPolicies = useMemo(
    () => policies.filter((policy) => filterPOS === "All POS" || String(policy.pos_display || "").trim() === filterPOS),
    [policies, filterPOS],
  );

  const reportPeriod = "Today to Next 45 Days";

  const handleExportExcel = (exportPolicies = filteredPolicies) => {
    if (!exportPolicies.length) return showValidation("No policy records available to export.");

    const rows = exportPolicies.map((p, idx) => {
      const row = { "Sr. No.": idx + 1 };
      COLUMNS.forEach(col => row[col.label] = getVal(p, col));
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map(h => ({ wch: Math.min(Math.max(h.length, 10) + 3, 40) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Renewal Report");
    
    const filename = "Policies_Upcoming_Renewal_Report_Next_45_Days.xlsx";
    XLSX.writeFile(workbook, filename);
    showSuccess(`Report "${filename}" downloaded successfully!`, { key: "renewals-export-success" });
  };

  return (
    <main className="renewals-dashboard mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <style>{`
        .renewals-dashboard, .renewals-dashboard button, .renewals-dashboard select, .renewals-dashboard input, .renewals-dashboard th { font-family: Arial, sans-serif; }
        .renewals-dashboard thead th { position: sticky; top: 0; z-index: 10; background-color: #f8fafc; }
        .renewals-dashboard thead { z-index: 10; }
        .table-wrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>
      <ReusableTable
        title={`Upcoming Policy Report · ${visibility === "all" ? "All Employees" : "My Data"}`}
        rows={filteredPolicies}
        columns={TABLE_COLUMNS}
        pageSize={10}
        filters={[
          {
            name: "pos",
            label: "POS",
            value: filterPOS,
            options: posOptions,
            onChange: (event) => setFilterPOS(event.target.value),
          },
        ]}
        onExport={handleExportExcel}
        recordLabel="policies"
        countSuffix={reportPeriod}
        loading={loading}
        loadingMessage="Loading upcoming policies..."
        error={error}
        emptyMessage="No upcoming policies found for the next 45 days."
      />
    </main>
  );
}
