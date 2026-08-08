import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import axiosInstance from "../../../../config/axios";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import { showApiError, showSuccess, showValidation } from "../../../../utils/alert";

// Define the columns for the grouped summary table
const REPORT_COLUMNS = [
  { key: "insurance_company", label: "Insurance Company" },
  { key: "insurer_branch", label: "Insurer Branch" },
  { key: "policy_count", label: "Total Policies (Count)" },
  { key: "total_od", label: "OD Premium", type: "currency" },
  { key: "total_tp", label: "TP Premium", type: "currency" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  { key: "od_comm", label: "OD Comm", type: "currency" },
  { key: "tp_comm", label: "TP Comm", type: "currency" },
  { key: "net_comm", label: "Net Comm", type: "currency" },
  { key: "total_comm", label: "Total Comm", type: "currency" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const displayValue = (row, column) => {
  const value = row[column.key];
  if (column.type === "currency") return formatCurrency(value);
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

const REUSABLE_REPORT_COLUMNS = REPORT_COLUMNS.map((column) => ({
  ...column,
  render: (_, row) => {
    const value = displayValue(row, column);
    return (
      <span title={value} className="text-slate-700">
        {value}
      </span>
    );
  },
}));

export default function ReportEntry() {
  const today = new Date();
  
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  
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

  // --- Dynamic Option Generators for Filters ---
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

  // --- Base Filtering Logic ---
  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      if (Number(policy.is_cancelled)) return false;
      const matchInsurer = insurer === "All Insurers" || String(policy.insurance_company || "").trim() === insurer;
      const matchBranch = insurerBranch === "All Branches" || String(policy.insurer_branch || "").trim() === insurerBranch;
      
      return matchInsurer && matchBranch;
    });
  }, [policies, insurer, insurerBranch]);

  // --- Group By Insurer & Branch Logic (Includes Commission Calculation) ---
  const groupedSummary = useMemo(() => {
    const groupMap = new Map();

    filteredPolicies.forEach((p) => {
      const insName = p.insurance_company?.trim() || "Unknown Insurer";
      const brName = p.insurer_branch?.trim() || "Unknown Branch";
      // Create a unique key for each Insurer + Branch combination
      const key = `${insName}|${brName}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          id: key,
          insurance_company: insName,
          insurer_branch: brName,
          policy_count: 0,
          total_od: 0,
          total_tp: 0,
          net_premium: 0,
          total_payable: 0,
          od_comm: 0,
          tp_comm: 0,
          net_comm: 0,
          total_comm: 0,
        });
      }

      const row = groupMap.get(key);
      
      // 1. Accumulate Policy Counts and Premiums
      row.policy_count += 1;
      row.total_od += Number(p.total_od) || 0;
      row.total_tp += Number(p.total_tp) || 0;
      row.net_premium += Number(p.net_premium) || 0;
      row.total_payable += Number(p.total_payable) || 0;

      // 2. Calculate Commission for THIS specific policy based on its IRDA percentages
      const policyOdComm = ((Number(p.total_od) || 0) * (Number(p.irda_od) || 0)) / 100;
      const policyTpComm = ((Number(p.total_tp) || 0) * (Number(p.irda_tp) || 0)) / 100;
      const policyNetComm = ((Number(p.net_premium) || 0) * (Number(p.irda_net) || 0)) / 100;

      // 3. Accumulate calculated commissions into the group total
      row.od_comm += policyOdComm;
      row.tp_comm += policyTpComm;
      row.net_comm += policyNetComm;
      row.total_comm += (policyOdComm + policyTpComm + policyNetComm);
    });

    // Convert map to array and sort alphabetically by Insurer, then by Branch
    return Array.from(groupMap.values()).sort((a, b) => {
      const cmp = a.insurance_company.localeCompare(b.insurance_company);
      if (cmp !== 0) return cmp;
      return a.insurer_branch.localeCompare(b.insurer_branch);
    });
  }, [filteredPolicies]);

  // --- Excel Export ---
  const exportExcel = (exportRows = groupedSummary) => {
    if (!exportRows.length) {
      showValidation("No summary records available to export.");
      return;
    }

    const rows = exportRows.map((row, index) => {
      const excelRow = { "Sr. No.": index + 1 };
      REPORT_COLUMNS.forEach((column) => {
        const value = row[column.key];
        excelRow[column.label] = column.type === "currency" ? (Number(value) || 0) : (value ?? "N/A");
      });
      return excelRow;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((heading) => ({
      wch: Math.min(45, Math.max(15, heading.length + 3)),
    }));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Grouped Summary");
    const filename = `Insurer_Summary_${monthTitle.replaceAll(" ", "_")}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showSuccess(`${filename} downloaded successfully.`, { key: "insurer-report-export-success" });
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
        .report-table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      {/* --- Main Grouped Data Table --- */}
      <ReusableTable
        key={`${month}-${year}`}
        title={`Insurer & Branch Summary · ${visibility === "all" ? "All Employees" : "My Data"}`}
        rows={groupedSummary} // Feed grouped data directly into the table
        columns={REUSABLE_REPORT_COLUMNS}
        pageSize={15}
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
                  setInsurer("All Insurers");
                  setInsurerBranch("All Branches");
                }}
              />
            ),
          },
          {
            name: "insurer",
            label: "Insurance Company",
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
        recordLabel="branches"
        countSuffix={monthTitle}
        loading={loading}
        loadingMessage="Loading summary report..."
        error={error}
        emptyMessage="No matching data found for this period."
      />
    </main>
  );
}
