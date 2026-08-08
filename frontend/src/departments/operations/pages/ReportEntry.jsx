import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "../../../config/axios";
import MonthYearPicker from "../../../pages/reusable/MonthYearPicker";
import ReusableTable from "../../../components/reusable/ReusableTable";
import { showApiError, showSuccess, showValidation } from "../../../utils/alert";

const REPORT_COLUMNS = [
  { key: "report_date", label: "Issue / Cancel Date", type: "date" },
  { key: "policy_number", label: "Policy Number" },
  { key: "policy_status", label: "Policy Status", type: "status" },
  { key: "bqp_display", label: "BQP" },
  { key: "reporting_manager_display", label: "Reporting Manager" },
  { key: "relationship_manager_display", label: "Relationship Manager" },
  { key: "pos_display", label: "POS" },
  { key: "reference_display", label: "Reference" },
  { key: "business_type", label: "Business Type" },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "insurer_branch", label: "Insurer Branch" },
  { key: "product_type", label: "Product Type" },
  { key: "categories", label: "Categories" },
  { key: "classification", label: "Classification" },
  { key: "insured_name", label: "Insured Name" },
  { key: "pan", label: "PAN" },
  { key: "gstin", label: "GSTIN" },
  { key: "contact", label: "Contact" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "issue_date", label: "Issue Date", type: "date" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "od_expiry", label: "OD Expiry", type: "date" },
  { key: "tp_expiry", label: "TP Expiry", type: "date" },
  { key: "idv", label: "IDV", type: "currency" },
  { key: "total_od", label: "Total OD", type: "currency" },
  { key: "total_tp", label: "Total TP", type: "currency" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "gst", label: "GST", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  { key: "make_name", label: "Make" },
  { key: "model_name", label: "Model" },
  { key: "variant_name", label: "Variant" },
  { key: "registration_number", label: "Registration Number" },
  { key: "rto", label: "RTO" },
  { key: "manufacturing_year", label: "Manufacturing Year" },
  { key: "chassis_number", label: "Chassis Number" },
  { key: "engine_number", label: "Engine Number" },
  { key: "fuel", label: "Fuel" },
  { key: "ncb", label: "NCB" },
  { key: "gvw", label: "GVW" },
  { key: "cc", label: "CC" },
  { key: "seating_capacity", label: "Seating Capacity" },
  { key: "financier", label: "Financier" },
  { key: "previous_insurer", label: "Previous Insurer" },
  { key: "previous_policy", label: "Previous Policy" },
  { key: "created_by_display", label: "Created By" },
];

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
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }).format(date);
};

const displayValue = (policy, column) => {
  const value = policy[column.key];
  if (column.type === "date") return formatDate(value);
  if (column.type === "datetime") return formatDateTime(value);
  if (column.type === "currency") return formatCurrency(value);
  if (column.type === "status") return value || "Active";
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

const REUSABLE_REPORT_COLUMNS = REPORT_COLUMNS.map((column) => ({
  ...column,
  render: (_, policy) => {
    const value = displayValue(policy, column);
    if (column.type === "status") {
      const cancelled = String(value).toLowerCase() === "cancelled";
      return (
        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${cancelled ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {value}
        </span>
      );
    }
    const isLongText = ["address", "verify_remark", "account_remark"].includes(column.key);
    return (
      <span
        title={value}
        className={`${column.key === "policy_number" ? "text-blue-600" : "text-slate-700"} ${isLongText ? "inline-block max-w-[200px] truncate align-bottom sm:max-w-[300px]" : ""}`}
      >
        {value}
      </span>
    );
  },
}));

export default function ReportEntry() {
  const today = new Date();
  
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  
  const [pos, setPos] = useState("All POS");
  const [policies, setPolicies] = useState([]);
  const [visibility, setVisibility] = useState("self");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const fetchReport = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axiosInstance.get("/policies/report/monthly", { params: { month, year } });
        if (!active) return;
        setPolicies(response.data?.data?.policies || []);
        setVisibility(response.data?.data?.visibility || "self");
      } catch (requestError) {
        if (!active) return;
        const message = requestError.response?.data?.message || "Unable to load policy report.";
        setError(message);
        setPolicies([]);
        showApiError(requestError, message);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchReport();
    return () => { active = false; };
  }, [month, year]);

  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)),
    [month, year],
  );

  const posOptions = useMemo(() => {
    const values = new Set(policies.map((policy) => String(policy.pos_display || "").trim()).filter(Boolean));
    return ["All POS", ...Array.from(values).sort((first, second) => first.localeCompare(second))];
  }, [policies]);

  const filteredPolicies = useMemo(
    () => policies.filter((policy) => pos === "All POS" || String(policy.pos_display || "").trim() === pos),
    [policies, pos],
  );

  const exportExcel = (exportRows = filteredPolicies) => {
    if (!exportRows.length) {
      showValidation("No policy records available to export.");
      return;
    }

    const rows = exportRows.map((policy, index) => {
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
    showSuccess(`${filename} downloaded successfully.`, { key: "operations-report-export-success" });
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
      <ReusableTable
        key={`${month}-${year}`}
        title={`Policies Report · ${visibility === "all" ? "All Employees" : "My Data"}`}
        rows={filteredPolicies}
        columns={REUSABLE_REPORT_COLUMNS}
        pageSize={10}
        filters={[
          {
            name: "reporting-period",
            render: (
              <MonthYearPicker
                month={month}
                year={year}
                onChange={(newMonth, newYear) => {
                  setMonth(newMonth);
                  setYear(newYear);
                  setPos("All POS");
                }}
              />
            ),
          },
          {
            name: "pos",
            label: "POS",
            value: pos,
            options: posOptions,
            onChange: (event) => setPos(event.target.value),
          },
        ]}
        onExport={exportExcel}
        recordLabel="policies"
        countSuffix={monthTitle}
        loading={loading}
        loadingMessage="Loading complete policy report..."
        error={error}
        emptyMessage="No matching policies found."
      />
    </main>
  );
}
