import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, FileDown, IndianRupee } from "lucide-react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import { accountsApi } from "../../services/accountsApi";
import { downloadPosWiseSelectedPoliciesPdf } from "./posWisePolicyPdf";

const monthValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const currency = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const formatDate = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date).replaceAll("/", "-");
};

const percentNumber = value => Number(String(value ?? "").replace("%", "")) || 0;

const posIncome = policy =>
  ((Number(policy.total_od) || 0) * percentNumber(policy.pos_od)) / 100 +
  ((Number(policy.total_tp) || 0) * percentNumber(policy.pos_tp)) / 100 +
  ((Number(policy.net_premium) || 0) * percentNumber(policy.pos_net)) / 100;

const rowKey = (policy, index = 0) => policy.report_row_id || policy.id || index;

function SummaryCard({ label, value }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
    </article>
  );
}

export default function PosWisePolicyDetails() {
  const { posId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(searchParams.get("month") || monthValue());
  const [reportRow, setReportRow] = useState(location.state?.posRow || null);
  const [policies, setPolicies] = useState(location.state?.posRow?.policy_details || []);
  const [serverSummary, setServerSummary] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setSearchParams({ month }, { replace: true });
  }, [month, setSearchParams]);

  useEffect(() => {
    let active = true;

    const loadPolicies = async () => {
      setLoading(true);
      setError("");
      setPolicies([]);
      setServerSummary(null);
      try {
        const data = await accountsApi.posWisePolicies(posId, { month });
        if (!active) return;
        setReportRow(data?.pos || location.state?.posRow || null);
        setPolicies(data?.policies || []);
        setServerSummary(data?.summary || null);
        setSelected(new Set());
      } catch (requestError) {
        try {
          const fallback = await accountsApi.posWiseReport({ month, posId });
          if (!active) return;
          const row = (fallback?.rows || []).find(item => String(item.pos_id) === String(posId)) || location.state?.posRow || null;
          setReportRow(row);
          setPolicies(row?.policy_details || []);
          setServerSummary(null);
          setSelected(new Set());
          setError("");
        } catch (fallbackError) {
          if (!active) return;
          const message =
            fallbackError.response?.data?.message ||
            requestError.response?.data?.message ||
            fallbackError.message ||
            requestError.message ||
            "Unable to load POS policies.";
          setReportRow(location.state?.posRow || null);
          const nextPolicies = location.state?.posRow?.policy_details || [];
          setPolicies(nextPolicies);
          setServerSummary(null);
          setError(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPolicies();
    return () => { active = false; };
  }, [location.state?.posRow, month, posId]);

  const rows = useMemo(() => policies || [], [policies]);
  const motorCount = useMemo(() =>
    rows.filter(policy => String(policy.policy_status || "").toLowerCase() !== "cancelled").length,
  [rows]);

  const togglePolicy = (policy, index) => {
    const key = rowKey(policy, index);
    setSelected(current => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleRows = tableRows => {
    const keys = tableRows.map((policy, index) => rowKey(policy, index));
    const everySelected = keys.length > 0 && keys.every(key => selected.has(key));
    setSelected(current => {
      const next = new Set(current);
      keys.forEach(key => {
        if (everySelected) next.delete(key);
        else next.add(key);
      });
      return next;
    });
  };

  const selectedRows = useMemo(() =>
    rows.filter((policy, index) => selected.has(rowKey(policy, index))),
  [rows, selected]);

  const calculatedSummary = useMemo(() => rows.reduce((result, policy) => {
    result.count += 1;
    result.od += Number(policy.total_od) || 0;
    result.tp += Number(policy.total_tp) || 0;
    result.net += Number(policy.net_premium) || 0;
    result.gross += Number(policy.total_payable) || 0;
    result.income += posIncome(policy);
    if (String(policy.policy_status || "").toLowerCase() === "cancelled") result.cancelled += 1;
    return result;
  }, { count: 0, cancelled: 0, od: 0, tp: 0, net: 0, gross: 0, income: 0 }), [rows]);
  const summary = serverSummary ? {
    count: Number(serverSummary.policy_count) || 0,
    cancelled: Number(serverSummary.cancelled_count) || 0,
    od: Number(serverSummary.total_od) || 0,
    tp: Number(serverSummary.total_tp) || 0,
    net: Number(serverSummary.net_premium) || 0,
    gross: Number(serverSummary.gross_premium) || 0,
    income: Number(serverSummary.total_income) || 0,
  } : calculatedSummary;

  const columns = useMemo(() => [
    {
      key: "select",
      label: "",
      headerClassName: "sticky top-0 whitespace-nowrap bg-slate-50 px-3 py-3",
      cellClassName: "whitespace-nowrap px-3 py-2",
      render: (_, row) => {
        const index = rows.indexOf(row);
        const key = rowKey(row, index);
        return (
          <input
            type="checkbox"
            checked={selected.has(key)}
            onChange={() => togglePolicy(row, index)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Select policy ${row.policy_number || index + 1}`}
          />
        );
      },
    },
    { key: "report_date", label: "Report Date", render: formatDate },
    { key: "policy_number", label: "Policy No." },
    {
      key: "policy_status",
      label: "Status",
      render: value => {
        const cancelled = String(value || "").toLowerCase() === "cancelled";
        return <span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${cancelled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{value || "Active"}</span>;
      },
    },
    { key: "insured_name", label: "Insured Name" },
    { key: "reference_display", label: "Reference" },
    { key: "business_type", label: "Business Type" },
    { key: "insurance_company", label: "Insurance Company" },
    { key: "insurer_branch", label: "Insurer Branch" },
    { key: "policy_type", label: "Policy Type" },
    { key: "vehicle_category", label: "Category" },
    { key: "commercial_vehicle_type", label: "Commercial Type" },
    { key: "idv", label: "IDV", render: currency },
    { key: "make_name", label: "Make" },
    { key: "model_name", label: "Model" },
    { key: "variant_name", label: "Variant" },
    { key: "registration_number", label: "Registration No." },
    { key: "rto", label: "RTO" },
    { key: "manufacturing_year", label: "Mfg Year" },
    { key: "chassis_number", label: "Chassis No." },
    { key: "engine_number", label: "Engine No." },
    { key: "fuel", label: "Fuel" },
    { key: "gvw", label: "GVW" },
    { key: "cc", label: "CC" },
    { key: "seating_capacity", label: "Seating" },
    { key: "issue_date", label: "Issue Date", render: formatDate },
    { key: "cancellation_record_created_at", label: "Cancel Created", render: formatDate },
    { key: "cancellation_date", label: "Cancel Date", render: formatDate },
    { key: "cancellation_reason", label: "Cancel Reason" },
    { key: "start_date", label: "Start Date", render: formatDate },
    { key: "od_expiry", label: "OD Expiry", render: formatDate },
    { key: "tp_expiry", label: "TP Expiry", render: formatDate },
    { key: "first_year_od", label: "First Year OD", render: currency },
    { key: "first_year_tp", label: "First Year TP", render: currency },
    { key: "total_od", label: "OD Premium", render: currency },
    { key: "total_tp", label: "TP Premium", render: currency },
    { key: "net_premium", label: "Net Premium", render: currency },
    { key: "gst", label: "GST", render: currency },
    { key: "total_payable", label: "Gross Premium", render: currency },
    { key: "pos_od", label: "POS OD %" },
    { key: "pos_tp", label: "POS TP %" },
    { key: "pos_net", label: "POS Net %" },
    { key: "pos_income", label: "POS Income", render: (_, row) => <span className="font-black text-blue-700">{currency(posIncome(row))}</span> },
    { key: "payment_status", label: "Payment" },
  ], [rows, selected]);

  const tableSelectAction = () => {
    if (!rows.length) return null;
    const keys = rows.map((policy, index) => rowKey(policy, index));
    const everySelected = keys.every(key => selected.has(key));
    return (
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-3 text-xs font-bold text-white">
          <input
            type="checkbox"
            checked={everySelected}
            onChange={() => toggleRows(rows)}
            className="h-4 w-4 rounded border-blue-100 text-blue-600 focus:ring-blue-500"
          />
          Select All
        </label>
        <button
          type="button"
          onClick={downloadSelectedPdf}
          disabled={!selectedRows.length}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-black uppercase tracking-wider text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown size={14} /> Generate PDF
        </button>
      </div>
    );
  };

  const downloadSelectedPdf = () => {
    downloadPosWiseSelectedPoliciesPdf({
      policies: selectedRows,
      pos: reportRow,
      month,
      posId,
    });
  };

  const exportExcel = exportRows => {
    if (!exportRows.length) return;
    const sheetRows = exportRows.map(policy => ({
      Selected: selected.has(rowKey(policy)) ? "Yes" : "No",
      "Report Date": formatDate(policy.report_date),
      "Policy No.": policy.policy_number,
      Status: policy.policy_status || "Active",
      "Insured Name": policy.insured_name,
      Reference: policy.reference_display,
      "Business Type": policy.business_type,
      "Insurance Company": policy.insurance_company,
      "Insurer Branch": policy.insurer_branch,
      "Policy Type": policy.policy_type,
      Category: policy.vehicle_category,
      "Commercial Type": policy.commercial_vehicle_type,
      IDV: policy.idv,
      Make: policy.make_name,
      Model: policy.model_name,
      Variant: policy.variant_name,
      "Registration No.": policy.registration_number,
      RTO: policy.rto,
      "Mfg Year": policy.manufacturing_year,
      "Chassis No.": policy.chassis_number,
      "Engine No.": policy.engine_number,
      Fuel: policy.fuel,
      GVW: policy.gvw,
      CC: policy.cc,
      Seating: policy.seating_capacity,
      "Issue Date": formatDate(policy.issue_date),
      "Cancel Created": formatDate(policy.cancellation_record_created_at),
      "Cancel Date": formatDate(policy.cancellation_date),
      "Cancel Reason": policy.cancellation_reason,
      "Start Date": formatDate(policy.start_date),
      "OD Expiry": formatDate(policy.od_expiry),
      "TP Expiry": formatDate(policy.tp_expiry),
      "First Year OD": policy.first_year_od,
      "First Year TP": policy.first_year_tp,
      "OD Premium": policy.total_od,
      "TP Premium": policy.total_tp,
      "Net Premium": policy.net_premium,
      GST: policy.gst,
      "Gross Premium": policy.total_payable,
      "POS OD %": policy.pos_od,
      "POS TP %": policy.pos_tp,
      "POS Net %": policy.pos_net,
      "POS Income": posIncome(policy),
      Payment: policy.payment_status,
    }));
    const sheet = XLSX.utils.json_to_sheet(sheetRows);
    sheet["!cols"] = Object.keys(sheetRows[0]).map(key => ({ wch: Math.min(32, Math.max(13, key.length + 2)) }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "POS Policies");
    XLSX.writeFile(book, `POS_Policies_${posId}_${month}.xlsx`);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-5 sm:px-6 sm:py-8">
      <header className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to={`/accounts/reports/pos-wise?month=${month}`} className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-800">
            <ArrowLeft size={14} /> Back to POS-wise
          </Link>
          <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-blue-600">Accounts Income Report</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">{reportRow?.pos_name || "POS Policies"}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">{reportRow?.pos_code || `POS ID ${posId}`} · active by issue date, cancelled by created date</p>
        </div>
        <MonthYearPicker
          label="Report Month"
          month={Number(month.slice(5, 7))}
          year={Number(month.slice(0, 4))}
          clearable={false}
          onChange={(nextMonth, nextYear) => setMonth(`${nextYear}-${String(nextMonth).padStart(2, "0")}`)}
        />
      </header>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label="Policies" value={summary.count} />
        <SummaryCard label="Cancelled" value={summary.cancelled} />
        <SummaryCard label="OD Premium" value={currency(summary.od)} />
        <SummaryCard label="TP Premium" value={currency(summary.tp)} />
        <SummaryCard label="Net Premium" value={currency(summary.net)} />
        <SummaryCard label="POS Income" value={currency(summary.income)} />
      </section>

      <ReusableTable
        title="POS Dependent Policy Data"
        subtitle={`${month} · ${motorCount} motor · ${summary.cancelled} cancelled · ${selected.size} selected`}
        headerAction={tableSelectAction()}
        rows={rows}
        columns={columns}
        loading={loading}
        error={error}
        pageSize={20}
        pageSizeOptions={[20, 50, 100]}
        showSerialNumber={false}
        searchConfig={{
          value: search,
          onChange: event => setSearch(event.target.value),
          placeholder: "Search policy, insured, company, vehicle, reference",
        }}
        onResetFilters={() => {
          setSearch("");
          setSelected(new Set());
        }}
        onExport={exportExcel}
        emptyMessage="No dependent policies found for this POS and month."
      />

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <BadgeCheck size={14} className="text-emerald-500" />
        <IndianRupee size={14} className="text-blue-500" />
        POS Income = OD, TP and Net premium commission based on POS percentages.
      </div>
    </main>
  );
}

