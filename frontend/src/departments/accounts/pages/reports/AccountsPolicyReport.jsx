import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import { accountsApi } from "../../api";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
const date = (value) => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? new Intl.DateTimeFormat("en-GB").format(parsed) : "—";
};

const baseColumns = [
  { key: "policy_number", label: "Policy Number" },
  { key: "insurance_company", label: "Insurer" },
  { key: "office_name", label: "Insurer Branch" },
  { key: "insured_name", label: "Insured Name" },
  { key: "policy_type", label: "Policy Type" },
  { key: "issue_date", label: "Issue Date", render: date },
  { key: "net_premium", label: "Net Premium", render: currency },
  { key: "total_payable", label: "Gross Premium", render: currency },
];

const verifyColumns = [
  ...baseColumns,
  { key: "verification_status", label: "Verification Status", render: (value) => <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${value === "Verified" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{value}</span> },
  { key: "verify_remark", label: "Verify Remark" },
  { key: "account_remark", label: "Account Remark" },
  { key: "payment_status", label: "Payment Status" },
];

const reportConfig = {
  insurer: { title: "Insurer Wise Report", filterKey: "insurance_company", filterLabel: "Insurer", columns: baseColumns },
  insured: { title: "Insured Wise Report", filterKey: "insured_name", filterLabel: "Insured", columns: baseColumns },
  verify: { title: "Verify Report", filterKey: "verification_status", filterLabel: "Verification", columns: verifyColumns },
};

export default function AccountsPolicyReport({ type }) {
  const today = new Date();
  const config = reportConfig[type] || reportConfig.insurer;
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState("All");
  const [policies, setPolicies] = useState([]);
  const [visibility, setVisibility] = useState("self");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await accountsApi.monthlyPolicies({ month, year });
        if (!active) return;
        const rows = Array.isArray(data?.policies) ? data.policies : [];
        setPolicies(rows.map((row) => ({ ...row, verification_status: String(row.verify_remark || "").trim() ? "Verified" : "Pending" })));
        setVisibility(data?.visibility || "self");
      } catch (requestError) {
        if (!active) return;
        setPolicies([]);
        setError(requestError.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [config.title, month, year]);

  const options = useMemo(() => ["All", ...Array.from(new Set(policies.map((row) => String(row[config.filterKey] || "").trim()).filter(Boolean))).sort()], [config.filterKey, policies]);
  const rows = useMemo(() => policies.filter((row) => selected === "All" || String(row[config.filterKey] || "").trim() === selected), [config.filterKey, policies, selected]);
  const exportExcel = (exportRows = rows) => {
    if (!exportRows.length) return;
    const sheet = XLSX.utils.json_to_sheet(exportRows.map((row, index) => ({
      "Sr. No.": index + 1,
      ...Object.fromEntries(config.columns.map((column) => [column.label, row[column.key] ?? "N/A"])),
    })));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, config.title.slice(0, 31));
    XLSX.writeFile(book, `${config.title.replaceAll(" ", "_")}_${year}_${String(month).padStart(2, "0")}.xlsx`);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <ReusableTable
        title={config.title}
        subtitle={`${visibility === "all" ? "All department data" : "Your data"} · policy issue month`}
        rows={rows}
        columns={config.columns}
        loading={loading}
        error={error}
        emptyMessage={`No records found for this ${config.title.toLowerCase()}.`}
        filters={[
          { name: "month", render: <MonthYearPicker month={month} year={year} onChange={(nextMonth, nextYear) => { setMonth(nextMonth); setYear(nextYear); setSelected("All"); }} /> },
          { name: config.filterKey, label: config.filterLabel, value: selected, options, onChange: (event) => setSelected(event.target.value) },
        ]}
        onResetFilters={() => setSelected("All")}
        onExport={exportExcel}
      />
    </main>
  );
}
