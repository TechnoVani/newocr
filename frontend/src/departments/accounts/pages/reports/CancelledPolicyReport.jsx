import { useCallback, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import { accountsApi } from "../../services/accountsApi";
import { showApiError, showSuccess, showValidation } from "../../../../utils/alert";

const REPORT_COLUMNS = [
  { key: "policy_number", label: "Policy Number" },
  { key: "policy_status", label: "Policy Status", type: "status" },
  { key: "cancellation_record_created_at", label: "Issue / Cancel Date", type: "datetime" },
  { key: "cancellation_reason", label: "Cancellation Reason" },
  { key: "insured_name", label: "Insured Name" },
  { key: "insurance_company", label: "Insurance Company" },
  { key: "insurer_branch", label: "Insurer Branch" },
  { key: "product_type", label: "Product Type" },
  { key: "categories", label: "Categories" },
  { key: "business_type", label: "Business Type" },
  { key: "issue_date", label: "Issue Date", type: "date" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "od_expiry", label: "OD Expiry", type: "date" },
  { key: "tp_expiry", label: "TP Expiry", type: "date" },
  { key: "net_premium", label: "Net Premium", type: "currency" },
  { key: "gst", label: "GST", type: "currency" },
  { key: "total_payable", label: "Gross Premium", type: "currency" },
  { key: "registration_number", label: "Registration Number" },
  { key: "rto", label: "RTO" },
  { key: "make_name", label: "Make" },
  { key: "model_name", label: "Model" },
  { key: "variant_name", label: "Variant" },
  { key: "pos_display", label: "POS" },
  { key: "reference_display", label: "Reference" },
  { key: "created_by_display", label: "Policy Created By" },
  { key: "cancellation_created_by_display", label: "Cancelled Entry By" },
  { key: "cancellation_created_at", label: "Cancelled Entry Time", type: "datetime" },
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const displayValue = (policy, column) => {
  const value = policy[column.key];
  if (column.type === "date") return formatDate(value);
  if (column.type === "datetime") return formatDateTime(value);
  if (column.type === "currency") return formatCurrency(value);
  if (column.type === "status") return value || "Cancelled";
  return value === null || value === undefined || value === "" ? "N/A" : String(value);
};

const TABLE_COLUMNS = REPORT_COLUMNS.map((column) => ({
  ...column,
  render: (_, policy) => {
    const value = displayValue(policy, column);
    if (column.type === "status") {
      return (
        <span className="rounded-full bg-rose-50 px-2 py-1 text-[9px] font-black uppercase text-rose-700">
          {value}
        </span>
      );
    }
    const isLongText = ["cancellation_reason", "insurer_branch"].includes(column.key);
    return (
      <span
        title={value}
        className={`${column.key === "policy_number" ? "text-blue-600" : "text-slate-700"} ${isLongText ? "inline-block max-w-[220px] truncate align-bottom sm:max-w-[340px]" : ""}`}
      >
        {value}
      </span>
    );
  },
}));

export default function CancelledPolicyReport() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    policy_number: "",
    cancellation_date: today.toISOString().slice(0, 10),
    cancellation_reason: "",
  });

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await accountsApi.cancelledPolicies({ month, year });
      setRecords(result?.policies || []);
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to load cancelled policy report.";
      setError(message);
      setRecords([]);
      showApiError(requestError, message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    // Remote report synchronization intentionally updates state after mount/filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReport();
  }, [loadReport]);

  const monthTitle = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)),
    [month, year],
  );

  const summary = useMemo(() => records.reduce(
    (totals, record) => {
      totals.count += 1;
      totals.net += Number(record.net_premium) || 0;
      totals.gross += Number(record.total_payable) || 0;
      return totals;
    },
    { count: 0, net: 0, gross: 0 },
  ), [records]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const saveCancelledPolicy = async (event) => {
    event.preventDefault();
    if (!form.policy_number.trim()) {
      showValidation("Policy number is required.");
      return;
    }
    if (!form.cancellation_date) {
      showValidation("Cancellation date is required.");
      return;
    }
    setSaving(true);
    try {
      await accountsApi.saveCancelledPolicy({
        policy_number: form.policy_number.trim(),
        cancellation_date: form.cancellation_date,
        cancellation_reason: form.cancellation_reason.trim() || undefined,
      });
      showSuccess("Cancelled policy record saved.", { key: "cancelled-policy-save-success" });
      setForm((current) => ({ ...current, policy_number: "", cancellation_reason: "" }));
      await loadReport();
    } catch (requestError) {
      showApiError(requestError, "Unable to save cancelled policy record.");
    } finally {
      setSaving(false);
    }
  };

  const exportExcel = (exportRows = records) => {
    if (!exportRows.length) {
      showValidation("No cancelled policy records available to export.");
      return;
    }
    const rows = exportRows.map((policy, index) => {
      const row = { "Sr. No.": index + 1 };
      REPORT_COLUMNS.forEach((column) => {
        row[column.label] = displayValue(policy, column);
      });
      return row;
    });
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((heading) => ({
      wch: Math.min(45, Math.max(14, heading.length + 3)),
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cancelled Policies");
    const filename = `Cancelled_Policies_${monthTitle.replaceAll(" ", "_")}.xlsx`;
    XLSX.writeFile(workbook, filename);
    showSuccess(`${filename} downloaded successfully.`, { key: "cancelled-policy-export-success" });
  };

  return (
    <main className="mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <form onSubmit={saveCancelledPolicy} className="mb-5 rounded-xl border border-rose-100 bg-white p-4 shadow-sm">
        <div className="mb-3">
          <p className="text-xs font-black uppercase tracking-widest text-rose-600">Accounts Report</p>
          <h1 className="text-lg font-black text-slate-900">Save Cancelled Policy Record</h1>
          <p className="text-xs font-semibold text-slate-500">Cancellation is recorded separately and reflected in every policy report.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-bold text-slate-600">
            Policy Number *
            <input
              value={form.policy_number}
              onChange={(event) => updateField("policy_number", event.target.value)}
              placeholder="Enter policy number"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Cancel Date *
            <input
              type="date"
              value={form.cancellation_date}
              onChange={(event) => updateField("cancellation_date", event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>
          <label className="text-xs font-bold text-slate-600">
            Reason / Remark
            <input
              value={form.cancellation_reason}
              onChange={(event) => updateField("cancellation_reason", event.target.value)}
              placeholder="Optional"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Cancel Record"}
          </button>
        </div>
      </form>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Cancelled Count</p>
          <p className="mt-1 text-lg font-black text-slate-900">{summary.count}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Net Premium</p>
          <p className="mt-1 text-lg font-black text-slate-900">{formatCurrency(summary.net)}</p>
        </div>
        <div className="rounded-xl border bg-white p-3 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Gross Premium</p>
          <p className="mt-1 text-lg font-black text-red-600">{formatCurrency(summary.gross)}</p>
        </div>
      </div>

      <ReusableTable
        key={`${month}-${year}`}
        title={`Cancelled Policies · ${monthTitle}`}
        rows={records}
        columns={TABLE_COLUMNS}
        pageSize={10}
        filters={[
          {
            name: "cancelled-period",
            render: (
              <MonthYearPicker
                month={month}
                year={year}
                onChange={(newMonth, newYear) => {
                  setMonth(newMonth);
                  setYear(newYear);
                }}
              />
            ),
          },
        ]}
        onExport={exportExcel}
        recordLabel="cancelled policies"
        countSuffix={monthTitle}
        loading={loading}
        loadingMessage="Loading cancelled policy report..."
        error={error}
        emptyMessage="No cancelled policy records found."
        rowClassName={(row, index) => `${index % 2 === 0 ? "bg-white" : "bg-red-50/40"} hover:bg-red-100/50`}
      />
    </main>
  );
}
