import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "../../../../config/axios";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import { showApiError, showSuccess, showValidation } from "../../../../utils/alert";

// Helper functions for profit calculations
const getIncome = (p) => {
  const odComm = ((Number(p.total_od) || 0) * (Number(p.irda_od) || 0)) / 100;
  const tpComm = ((Number(p.total_tp) || 0) * (Number(p.irda_tp) || 0)) / 100;
  const netComm = ((Number(p.net_premium) || 0) * (Number(p.irda_net) || 0)) / 100;
  return odComm + tpComm + netComm;
};

const getGiven = (p) => {
  const odComm = ((Number(p.total_od) || 0) * (Number(p.pos_od) || 0)) / 100;
  const tpComm = ((Number(p.total_tp) || 0) * (Number(p.pos_tp) || 0)) / 100;
  const netComm = ((Number(p.net_premium) || 0) * (Number(p.pos_net) || 0)) / 100;
  return odComm + tpComm + netComm;
};

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
  { key: "policy_type", label: "Policy Type" },
  { key: "vehicle_category", label: "Vehicle Category" },
  { key: "commercial_vehicle_type", label: "Commercial Vehicle Type" },
  { key: "insured_name", label: "Insured Name" },
  { key: "address", label: "Address" },
  { key: "issue_date", label: "Issue Date", type: "date" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "od_expiry", label: "OD Expiry", type: "date" },
  { key: "tp_expiry", label: "TP Expiry", type: "date" },
  { key: "make_name", label: "Make" },
  { key: "model_name", label: "Model" },
  { key: "variant_name", label: "Variant" },
  { key: "registration_number", label: "Registration Number" },
  { key: "rto", label: "RTO" },
  { key: "manufacturing_year", label: "Manufacturing Year" },
  { key: "chassis_number", label: "Chassis Number" },
  { key: "engine_number", label: "Engine Number" },
  { key: "fuel", label: "Fuel" },
  { key: "gvw", label: "GVW" },
  { key: "cc", label: "CC" },
  { key: "seating_capacity", label: "Seating Capacity" },
  { key: "first_year_od", label: "First Year OD", type: "currency" },
  { key: "first_year_tp", label: "First Year TP", type: "currency" },
  { key: "total_od", label: "Total OD", type: "currency" },
  { key: "total_tp", label: "Total TP", type: "currency" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "gst", label: "GST", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  
  // --- Income Calculations ---
  { key: "irda_od", label: "Income Od (%)", type: "percentage" },
  { key: "irda_tp", label: "Income Tp (%)", type: "percentage" },
  { key: "irda_net", label: "Income Net (%)", type: "percentage" },
  { key: "income_od_comm", label: "Income Od Comm", type: "currency", getValue: (p) => ((Number(p.total_od) || 0) * (Number(p.irda_od) || 0)) / 100 },
  { key: "income_tp_comm", label: "Income Tp Comm", type: "currency", getValue: (p) => ((Number(p.total_tp) || 0) * (Number(p.irda_tp) || 0)) / 100 },
  { key: "income_net_comm", label: "Income Net Comm", type: "currency", getValue: (p) => ((Number(p.net_premium) || 0) * (Number(p.irda_net) || 0)) / 100 },
  { key: "total_income", label: "Total Income", type: "currency", getValue: getIncome },

  // --- Given (POS) Calculations ---
  { key: "pos_od", label: "Given Od (%)", type: "percentage" },
  { key: "pos_tp", label: "Given Tp (%)", type: "percentage" },
  { key: "pos_net", label: "Given Net (%)", type: "percentage" },
  { key: "given_od_comm", label: "Given Od Comm", type: "currency", getValue: (p) => ((Number(p.total_od) || 0) * (Number(p.pos_od) || 0)) / 100 },
  { key: "given_tp_comm", label: "Given Tp Comm", type: "currency", getValue: (p) => ((Number(p.total_tp) || 0) * (Number(p.pos_tp) || 0)) / 100 },
  { key: "given_net_comm", label: "Given Net Comm", type: "currency", getValue: (p) => ((Number(p.net_premium) || 0) * (Number(p.pos_net) || 0)) / 100 },
  { key: "total_given", label: "Total Given", type: "currency", getValue: getGiven },

  // --- Profit Calculations ---
  { 
    key: "profit_amount", 
    label: "Profit Amount", 
    type: "currency",
    getValue: (p) => getIncome(p) - getGiven(p) 
  },
  { 
    key: "profit_percentage", 
    label: "Profit (%)", 
    type: "percentage",
    getValue: (p) => {
      const income = getIncome(p);
      const given = getGiven(p);
      if (income === 0) return 0;
      return ((income - given) / income) * 100;
    }
  },

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
  const value = column.getValue ? column.getValue(policy) : policy[column.key];
  
  if (column.type === "date") return formatDate(value);
  if (column.type === "datetime") return formatDateTime(value);
  if (column.type === "currency") return formatCurrency(value);
  if (column.type === "status") return value || "Active";
  
  if (column.type === "percentage") {
    return (value !== null && value !== undefined) ? `${Number(value).toFixed(2)}%` : "0.00%";
  }
  
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

const REUSABLE_REPORT_COLUMNS = REPORT_COLUMNS.map((column) => ({
  ...column,
  render: (_, policy) => {
    const value = displayValue(policy, column);
    const isLongText = ["address", "verify_remark", "account_remark", "cancellation_reason"].includes(column.key);
    if (column.type === "status") {
      const cancelled = String(value).toLowerCase() === "cancelled";
      return (
        <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${cancelled ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {value}
        </span>
      );
    }
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
  const [insurer, setInsurer] = useState("All Insurers");
  const [insurerBranch, setInsurerBranch] = useState("All Branches");
  
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
    return ["All POS", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [policies]);

  const insurerOptions = useMemo(() => {
    const values = new Set(policies.map((policy) => String(policy.insurance_company || "").trim()).filter(Boolean));
    return ["All Insurers", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [policies]);

  const branchOptions = useMemo(() => {
    let filteredForBranch = policies;
    if (insurer !== "All Insurers") {
      filteredForBranch = policies.filter((p) => String(p.insurance_company || "").trim() === insurer);
    }
    const values = new Set(filteredForBranch.map((policy) => String(policy.insurer_branch || "").trim()).filter(Boolean));
    return ["All Branches", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [policies, insurer]);

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchPos = pos === "All POS" || String(policy.pos_display || "").trim() === pos;
      const matchInsurer = insurer === "All Insurers" || String(policy.insurance_company || "").trim() === insurer;
      const matchBranch = insurerBranch === "All Branches" || String(policy.insurer_branch || "").trim() === insurerBranch;
      
      return matchPos && matchInsurer && matchBranch;
    });
  }, [policies, pos, insurer, insurerBranch]);

  // --- Expanded Summary Calculations ---
  const summaryData = useMemo(() => {
    let totalOD = 0;
    let totalTP = 0;
    let totalNet = 0;
    let totalGross = 0;
    let totalIncome = 0;
    let totalGiven = 0;
    let totalProfit = 0;

    filteredPolicies.forEach((policy) => {
      totalOD += Number(policy.total_od) || 0;
      totalTP += Number(policy.total_tp) || 0;
      totalNet += Number(policy.net_premium) || 0;
      totalGross += Number(policy.total_payable) || 0;
      
      const income = getIncome(policy);
      const given = getGiven(policy);
      
      totalIncome += income;
      totalGiven += given;
      totalProfit += (income - given);
    });

    return {
      count: filteredPolicies.filter((policy) => !Number(policy.is_cancelled)).length,
      od: totalOD,
      tp: totalTP,
      net: totalNet,
      gross: totalGross,
      income: totalIncome,
      given: totalGiven,
      profit: totalProfit,
    };
  }, [filteredPolicies]);

  const exportExcel = (exportRows = filteredPolicies) => {
    if (!exportRows.length) {
      showValidation("No policy records available to export.");
      return;
    }

    const rows = exportRows.map((policy, index) => {
      const row = { "Sr. No.": index + 1 };
      REPORT_COLUMNS.forEach((column) => {
        const value = column.getValue ? column.getValue(policy) : policy[column.key];
        row[column.label] = column.type === "date"
          ? formatDate(value)
          : column.type === "datetime"
            ? formatDateTime(value)
            : column.type === "percentage"
              ? (value !== null && value !== undefined ? `${Number(value).toFixed(2)}%` : "0.00%")
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
    showSuccess(`${filename} downloaded successfully.`, { key: "insured-report-export-success" });
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
        .report-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      {/* --- Top Summary Separate Cards on a Single Row (Grid) --- */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Count</p>
          <p className="mt-1 text-lg font-bold text-gray-800">{summaryData.count}</p>
        </div>
        
        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">OD Premium</p>
          <p className="mt-1 text-base font-bold text-slate-700">{formatCurrency(summaryData.od)}</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">TP Premium</p>
          <p className="mt-1 text-base font-bold text-slate-700">{formatCurrency(summaryData.tp)}</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Net Premium</p>
          <p className="mt-1 text-base font-bold text-slate-700">{formatCurrency(summaryData.net)}</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Gross Premium</p>
          <p className="mt-1 text-base font-bold text-blue-600">{formatCurrency(summaryData.gross)}</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Income</p>
          <p className="mt-1 text-base font-bold text-emerald-600">{formatCurrency(summaryData.income)}</p>
        </div>

        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Given</p>
          <p className="mt-1 text-base font-bold text-orange-500">{formatCurrency(summaryData.given)}</p>
        </div>
        
        <div className="flex flex-col rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Total Profit</p>
          <p className={`mt-1 text-base font-bold ${summaryData.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {summaryData.profit > 0 ? "+" : ""}{formatCurrency(summaryData.profit)}
          </p>
        </div>
      </div>

      {/* --- Main Table --- */}
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
                  setInsurer("All Insurers");
                  setInsurerBranch("All Branches");
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
          {
            name: "insurer",
            label: "Insurer Company",
            value: insurer,
            options: insurerOptions,
            onChange: (event) => {
              setInsurer(event.target.value);
              setInsurerBranch("All Branches"); 
            },
          },
          {
            name: "insurerBranch",
            label: "Insurer Branch",
            value: insurerBranch,
            options: branchOptions,
            onChange: (event) => setInsurerBranch(event.target.value),
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
