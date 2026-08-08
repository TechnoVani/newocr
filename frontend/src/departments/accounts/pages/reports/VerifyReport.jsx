import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import { accountsApi } from "../../services/accountsApi";
import { showApiError, showSuccess, showValidation } from "../../../../utils/alert";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const percentage = (value) => `${Number.parseFloat(value) || 0}%`;

const compactNumber = (value) => {
  if (value === null || value === undefined || value === "" || /^[-–—]+$/.test(String(value).trim())) return "0";
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed)
    ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(parsed)
    : "—";
};

const displayDate = (value) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("en-GB").format(parsed);
};

const IMPORT_COLUMNS = [
  { key: "policy_number", header: "Policy Number", aliases: ["policy no", "policyno", "policynumber"] },
  { key: "insurance_company", header: "Insurance Company", aliases: ["insurer", "insurer name", "company", "company name"] },
  { key: "insured_name", header: "Customer Name", aliases: ["insured name", "customer", "insured"] },
  { key: "issue_date", header: "Issue Date", aliases: ["policy issue date"] },
  { key: "total_od", header: "Total OD", aliases: ["od premium", "total od premium"] },
  { key: "total_tp", header: "Total TP", aliases: ["tp premium", "total tp premium"] },
  { key: "net_premium", header: "Net Premium", aliases: ["net"] },
  { key: "irda_od", header: "IRDA OD %", aliases: ["irda od", "irdaod"] },
  { key: "irda_tp", header: "IRDA TP %", aliases: ["irda tp", "irdatp"] },
  { key: "irda_net", header: "IRDA Net %", aliases: ["irda net", "irdanet"] },
  { key: "remark", header: "Remark", aliases: ["remarks", "comment", "comments"] },
];

const normalizeHeader = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const headerKeyMap = new Map(IMPORT_COLUMNS.flatMap((column) =>
  [column.header, column.key, ...column.aliases].map((label) => [normalizeHeader(label), column.key])));

const parseImportWorkbook = async (file) => {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
    dateNF: "yyyy-mm-dd",
  });
  const sheetName = workbook.SheetNames.find((name) =>
    normalizeHeader(name) === normalizeHeader("Insurer Statement")) || workbook.SheetNames[0];
  if (!sheetName) throw new Error("The workbook does not contain a worksheet.");
  const sourceRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  if (!sourceRows.length) throw new Error("The insurer statement worksheet is empty.");

  const rows = sourceRows.map((sourceRow) => {
    const normalizedRow = {};
    Object.entries(sourceRow).forEach(([header, value]) => {
      const key = headerKeyMap.get(normalizeHeader(header));
      if (key) normalizedRow[key] = value;
    });
    return normalizedRow;
  }).filter((row) => Object.values(row).some((value) => String(value || "").trim()));

  if (!rows.length || !rows.some((row) => String(row.policy_number || "").trim())) {
    throw new Error('The Excel file must contain a "Policy Number" column.');
  }
  return rows;
};

const createTemplateWorkbook = () => {
  const workbook = XLSX.utils.book_new();
  const statementRows = [{
    "Policy Number": "POLICY-EXAMPLE-001",
    "Insurance Company": "New India Assurance",
    "Customer Name": "Demo Customer",
    "Issue Date": "15-06-2026",
    "Total OD": 1000,
    "Total TP": 500,
    "Net Premium": 1500,
    "IRDA OD %": 5,
    "IRDA TP %": 2,
    "IRDA Net %": 1,
    Remark: "Dummy row - replace with actual data",
  }];
  const statementSheet = XLSX.utils.json_to_sheet(statementRows);
  statementSheet["!autofilter"] = { ref: statementSheet["!ref"] };
  statementSheet["!cols"] = IMPORT_COLUMNS.map((column) => ({
    wch: Math.max(15, column.header.length + 3),
  }));
  XLSX.utils.book_append_sheet(workbook, statementSheet, "Insurer Statement");

  const instructionSheet = XLSX.utils.aoa_to_sheet([
    ["Insurer Statement Reconciliation Import"],
    ["Rule", "Description"],
    ["Policy Number", "Required. Matching ignores spaces, slashes, and hyphens."],
    ["Insurance Company", "The insurer/company name, for example New India Assurance. Used by the company filter."],
    ["Customer Name", "The policyholder/insured customer name."],
    ["Premium values", "Enter numeric values without currency symbols where possible."],
    ["IRDA percentages", "Enter 5 or 5%; both are accepted as 5 percent."],
    ["Remark", "Optional statement note saved with the imported policy row."],
    ["Duplicate policies", "Duplicate policy numbers in one file are rejected. Reimporting an existing policy number updates its saved row."],
    ["Import behavior", "Import is independent of the selected report month. Each policy number has one saved insurer row."],
    ["Policy Issue Month", "Filters only our policy table using policy Issue Date."],
    ["Excel Created Month", "Filters Excel rows using the database Created Date recorded when the file was uploaded."],
    ["Independent filters", "Select one filter at a time. Choosing Issue Month clears Created Month, and choosing Created Month clears Issue Month."],
  ]);
  instructionSheet["!cols"] = [{ wch: 24 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(workbook, instructionSheet, "Instructions");
  return workbook;
};

const resultExportColumns = [
  ["Status", "status"],
  ["Policy Number", "policy_number"],
  ["Policy Issue Date", "policy_issue_date"],
  ["Excel Issue Month", "statement_period"],
  ["Match Date", "match_date"],
  ["Our Insurance Company", "our_insurance_company"],
  ["Excel Insurance Company", "excel_insurance_company"],
  ["Customer Name", "insured_name"],
  ["Our Customer Name", "our_insured_name"],
  ["Excel Customer Name", "insurer_insured_name"],
  ["Remark", "remark"],
  ["Mismatch Fields", "mismatch_fields"],
  ["Our Total OD", "our_total_od"],
  ["Excel Total OD", "insurer_total_od"],
  ["Our Total TP", "our_total_tp"],
  ["Excel Total TP", "insurer_total_tp"],
  ["Our Net Premium", "our_net_premium"],
  ["Excel Net Premium", "insurer_net_premium"],
  ["Our IRDA OD %", "our_irda_od"],
  ["Excel IRDA OD %", "insurer_irda_od"],
  ["Our IRDA TP %", "our_irda_tp"],
  ["Excel IRDA TP %", "insurer_irda_tp"],
  ["Our IRDA Net %", "our_irda_net"],
  ["Excel IRDA Net %", "insurer_irda_net"],
];

const writeResultSheet = (workbook, name, rows) => {
  const data = rows.length
    ? rows.map((row) => Object.fromEntries(resultExportColumns.map(([label, key]) => {
        const value = row[key];
        if (key.includes("irda_") && value !== null && value !== undefined && value !== "") {
          const numericValue = Number.parseFloat(value);
          return [label, Number.isFinite(numericValue) ? numericValue : ""];
        }
        return [label, value ?? ""];
      })))
    : [Object.fromEntries(resultExportColumns.map(([label]) => [label, ""]))];
  const sheet = XLSX.utils.json_to_sheet(data);
  sheet["!autofilter"] = { ref: sheet["!ref"] };
  sheet["!cols"] = resultExportColumns.map(([label]) => ({ wch: Math.min(40, Math.max(15, label.length + 3)) }));
  XLSX.utils.book_append_sheet(workbook, sheet, name);
};

const commonColumns = [
  { key: "policy_number", label: "Policy Number" },
  { key: "policy_issue_date", label: "Policy Issue Date", render: displayDate },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "insured_name", label: "Customer Name" },
  {
    key: "remark",
    label: "Remark",
    render: (value) => (
      <span className="inline-block max-w-[260px] whitespace-normal" title={value || ""}>
        {value || "—"}
      </span>
    ),
  },
];

const comparisonColumn = ({ key, label, field, ourKey, excelKey, formatter = compactNumber }) => ({
  key,
  label: `${label} (Our / Excel)`,
  searchValue: (row) => `${row[ourKey] ?? ""} ${row[excelKey] ?? ""}`,
  render: (_, row) => {
    const hasMismatch = (row.mismatch_details || []).some((detail) => detail.field === field);
    const ourValue = formatter(row[ourKey]);
    const excelValue = formatter(row[excelKey]);
    return (
      <span className={`inline-flex min-w-[110px] justify-center rounded-lg px-2 py-1.5 font-extrabold ${
        hasMismatch
          ? "bg-rose-100 text-rose-700 ring-1 ring-rose-200"
          : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
      }`}>
        {ourValue === excelValue ? ourValue : `${ourValue} / ${excelValue}`}
      </span>
    );
  },
});

const verificationColumns = [
  {
    key: "status",
    label: "Status",
    render: (value) => (
      <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold uppercase ${
        value === "complete_match"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-rose-100 text-rose-700"
      }`}>
        {value === "complete_match" ? "Complete Match" : "Field Mismatch"}
      </span>
    ),
  },
  ...commonColumns.filter((column) => !["insured_name", "policy_issue_date"].includes(column.key)),
  { key: "our_insured_name", label: "Our Customer Name" },
  comparisonColumn({
    key: "issue_date_comparison",
    label: "Issue Date",
    field: "issue_date",
    ourKey: "policy_issue_date",
    excelKey: "insurer_issue_date",
    formatter: displayDate,
  }),
  comparisonColumn({ key: "total_od_comparison", label: "OD Premium", field: "total_od", ourKey: "our_total_od", excelKey: "insurer_total_od" }),
  comparisonColumn({ key: "total_tp_comparison", label: "TP Premium", field: "total_tp", ourKey: "our_total_tp", excelKey: "insurer_total_tp" }),
  comparisonColumn({ key: "net_premium_comparison", label: "Net Premium", field: "net_premium", ourKey: "our_net_premium", excelKey: "insurer_net_premium" }),
  comparisonColumn({ key: "irda_od_comparison", label: "IRDA OD %", field: "irda_od", ourKey: "our_irda_od", excelKey: "insurer_irda_od" }),
  comparisonColumn({ key: "irda_tp_comparison", label: "IRDA TP %", field: "irda_tp", ourKey: "our_irda_tp", excelKey: "insurer_irda_tp" }),
  comparisonColumn({ key: "irda_net_comparison", label: "IRDA Net %", field: "irda_net", ourKey: "our_irda_net", excelKey: "insurer_irda_net" }),
];

const insurerExtraColumns = [
  ...commonColumns,
  { key: "insurer_total_od", label: "Excel OD", render: money },
  { key: "insurer_total_tp", label: "Excel TP", render: money },
  { key: "insurer_net_premium", label: "Excel Net", render: money },
  { key: "insurer_irda_od", label: "IRDA OD", render: percentage },
  { key: "insurer_irda_tp", label: "IRDA TP", render: percentage },
  { key: "insurer_irda_net", label: "IRDA Net", render: percentage },
];

const ourExtraColumns = [
  ...commonColumns.filter((column) => !["statement_period", "match_date", "remark"].includes(column.key)),
  { key: "our_total_od", label: "Our OD", render: money },
  { key: "our_total_tp", label: "Our TP", render: money },
  { key: "our_net_premium", label: "Our Net", render: money },
  { key: "our_irda_od", label: "IRDA OD", render: percentage },
  { key: "our_irda_tp", label: "IRDA TP", render: percentage },
  { key: "our_irda_net", label: "IRDA Net", render: percentage },
];

const emptyReport = {
  summary: {
    complete_match: 0,
    field_mismatch: 0,
    insurer_extra: 0,
    our_extra: 0,
    imported_rows: 0,
    has_import_data: false,
  },
  completeMatches: [],
  fieldMismatches: [],
  insurerExtras: [],
  ourExtras: [],
  insurance_company_options: [],
};

export default function VerifyReport() {
  const inputRef = useRef(null);
  const [month, setMonth] = useState(null);
  const [year, setYear] = useState(null);
  const [createdMonth, setCreatedMonth] = useState(null);
  const [createdYear, setCreatedYear] = useState(null);
  const [insuranceCompany, setInsuranceCompany] = useState("All Companies");
  const [report, setReport] = useState(emptyReport);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await accountsApi.reconciliationReport({
        month,
        year,
        createdMonth,
        createdYear,
        insurance_company: insuranceCompany,
      }));
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to load verification reconciliation.";
      setReport(emptyReport);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [createdMonth, createdYear, insuranceCompany, month, year]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const periodLabel = useMemo(
    () => month && year
      ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
      : "All Policy Issue Dates",
    [month, year],
  );
  const createdPeriodLabel = useMemo(
    () => createdMonth && createdYear
      ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(createdYear, createdMonth - 1, 1))
      : "All Excel Created Dates",
    [createdMonth, createdYear],
  );
  const companyFilterLabel = insuranceCompany;
  const verifiedRows = useMemo(
    () => [...(report.completeMatches || []), ...(report.fieldMismatches || [])],
    [report.completeMatches, report.fieldMismatches],
  );

  const downloadTemplate = () => {
    const workbook = createTemplateWorkbook();
    XLSX.writeFile(workbook, "Insurer_Statement_Import_Format.xlsx");
    showSuccess("Insurer statement import format downloaded.", { key: "verify-template-success" });
  };

  const exportResults = () => {
    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["Verify Report Filters and Summary"],
      ["Policy Issue Month", periodLabel],
      ["Excel Created Month", createdPeriodLabel],
      ["Insurance Company", companyFilterLabel],
      [],
      ["Result", "Count"],
      ["Complete Match", Number(report.summary?.complete_match) || 0],
      ["Field Mismatch", Number(report.summary?.field_mismatch) || 0],
      ["Excel Extra", Number(report.summary?.insurer_extra) || 0],
      ["Our Extra", Number(report.summary?.our_extra) || 0],
      ["Filtered Excel Rows", Number(report.summary?.imported_rows) || 0],
    ]);
    summarySheet["!cols"] = [{ wch: 26 }, { wch: 35 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Filters & Summary");
    writeResultSheet(workbook, "Verified Policies", verifiedRows);
    writeResultSheet(workbook, "Excel Extras", report.insurerExtras || []);
    writeResultSheet(workbook, "Our Extras", report.ourExtras || []);
    XLSX.writeFile(
      workbook,
      `Verification_Results_Issue_${year || "All"}_${month ? String(month).padStart(2, "0") : "All"}_Created_${createdYear || "All"}_${createdMonth ? String(createdMonth).padStart(2, "0") : "All"}.xlsx`,
    );
    showSuccess("Verification results exported.", { key: "verify-export-success" });
  };

  const importExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      showValidation("Please select an Excel or CSV file.");
      return;
    }
    setImporting(true);
    try {
      const rows = await parseImportWorkbook(file);
      const result = await accountsApi.importReconciliation({
        rows,
      });
      showSuccess(`${result.imported} insurer statement rows imported.`, { key: "verify-import-success" });
      await loadReport();
    } catch (importError) {
      showApiError(importError, "Unable to import insurer statement.", { key: "verify-import-error" });
    } finally {
      setImporting(false);
    }
  };

  const summaryCards = [
    ["Imported Rows", report.summary?.imported_rows, "text-blue-700"],
    ["Complete Match", report.summary?.complete_match, "text-emerald-700"],
    ["Field Mismatch", report.summary?.field_mismatch, "text-rose-700"],
    ["Excel Extra", report.summary?.insurer_extra, "text-amber-700"],
    ["Our Extra", report.summary?.our_extra, "text-violet-700"],
  ];
  const hasActivePeriodFilter = Boolean(
    (month && year) || (createdMonth && createdYear),
  );
  const hasImportedStatement = Boolean(report.summary?.has_import_data);
  const canShowReport = hasActivePeriodFilter && hasImportedStatement;

  return (
    <main className="mx-auto flex w-full max-w-[1900px] flex-1 flex-col gap-5 px-3 py-4 sm:px-6 sm:py-8">
      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-slate-800">Verify Report Reconciliation</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Match insurer statements to uploaded policies by policy number, including statements received in later months.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <MonthYearPicker label="Policy Issue Month" month={month} year={year} onChange={(nextMonth, nextYear) => {
              setMonth(nextMonth);
              setYear(nextYear);
              if (nextMonth && nextYear) {
                setCreatedMonth(null);
                setCreatedYear(null);
              }
            }} />
            <MonthYearPicker label="Excel Created Month" month={createdMonth} year={createdYear} onChange={(nextMonth, nextYear) => {
              setCreatedMonth(nextMonth);
              setCreatedYear(nextYear);
              if (nextMonth && nextYear) {
                setMonth(null);
                setYear(null);
              }
            }} />
            <label className="relative block pt-2">
              <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Insurance Company</span>
              <select
                value={insuranceCompany}
                onChange={(event) => setInsuranceCompany(event.target.value)}
                className="h-9 w-52 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10"
              >
                <option value="All Companies">All Companies</option>
                {(report.insurance_company_options || []).map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={downloadTemplate} className="flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-[10px] font-bold uppercase tracking-wider text-blue-700 hover:bg-blue-100">
              <FileSpreadsheet size={14} /> Download Import Format
            </button>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={importExcel} className="hidden" />
            <button type="button" disabled={importing} onClick={() => inputRef.current?.click()} className="flex h-9 items-center justify-center gap-2 rounded-xl bg-[#1E88E5] px-4 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm disabled:opacity-50">
              <Upload size={14} /> {importing ? "Importing..." : "Import Excel"}
            </button>
            <button type="button" disabled={!canShowReport} onClick={exportResults} className="flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-[10px] font-bold uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-40">
              <Download size={14} /> Export Results
            </button>
          </div>
        </div>
      </section>

      {!loading && !hasActivePeriodFilter ? (
        <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-12 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-blue-400" />
          <h2 className="mt-3 text-sm font-extrabold text-slate-700">Select at least one month filter</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Choose either Policy Issue Month or Excel Created Month to generate the Verify Report.
          </p>
        </section>
      ) : !loading && !hasImportedStatement ? (
        <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 px-6 py-12 text-center">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-blue-400" />
          <h2 className="mt-3 text-sm font-extrabold text-slate-700">Import Excel to generate the Verify Report</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            No statement data has been imported yet. Report tables will appear after the first Excel import.
          </p>
        </section>
      ) : canShowReport ? (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {summaryCards.map(([label, value, color]) => (
              <article key={label} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`mt-1 text-2xl font-extrabold ${color}`}>{Number(value) || 0}</p>
              </article>
            ))}
          </section>

          <ReusableTable
            title="Verified Policies"
            subtitle={`${periodLabel} policy issue date · Excel created ${createdPeriodLabel} · ${companyFilterLabel}`}
            rows={verifiedRows}
            columns={verificationColumns}
            loading={loading}
            error={error}
            pageSize={10}
            emptyMessage="No matched policy numbers found."
            rowClassName={(row) => row.status === "complete_match"
              ? "bg-emerald-50/60 hover:bg-emerald-100/70"
              : "bg-white hover:bg-slate-50"}
          />

          <ReusableTable
            title="Excel Extra Policies"
            subtitle={`Excel created ${createdPeriodLabel} · ${companyFilterLabel} · not found in ${periodLabel} policies`}
            rows={report.insurerExtras || []}
            columns={insurerExtraColumns}
            loading={loading}
            error={error}
            pageSize={10}
            emptyMessage="No insurer extra policies found."
          />

          <ReusableTable
            title="Our Extra Policies"
            subtitle={`${periodLabel} policy issue date · ${companyFilterLabel} · missing from Excel created ${createdPeriodLabel}`}
            rows={report.ourExtras || []}
            columns={ourExtraColumns}
            loading={loading}
            error={error}
            pageSize={10}
            emptyMessage="No unmatched policies remain in our database."
          />
        </>
      ) : null}
    </main>
  );
}
