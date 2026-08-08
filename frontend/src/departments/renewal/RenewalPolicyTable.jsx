import { useEffect, useMemo, useState } from "react";
import { MessageSquarePlus, RefreshCw, TriangleAlert, X } from "lucide-react";
import ReusableTable from "../../components/reusable/ReusableTable";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import { departmentApi } from "../shared/departmentApi";
import { accountsApi } from "../accounts/services/accountsApi";

const today = () => new Date().toISOString().slice(0, 10);

const formatApiDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "N/A"
    : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date).replaceAll("/", "-");
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);

const OPERATION_RENEWAL_COLUMNS = [
  { label: "Policy No", key: "policy_number", cls: "font-bold text-blue-600 select-all" },
  { label: "Client Name", key: "insured_name", cls: "font-extrabold uppercase text-slate-800 max-w-[200px] truncate" },
  { label: "Relationship Manager", key: "relationship_manager_display" },
  { label: "POS", key: "pos_display" },
  { label: "Reference", key: "reference_display" },
  { label: "Created By", key: "created_by_display" },
  { label: "Insurer", key: "insurance_company", cls: "max-w-[200px] truncate" },
  { label: "LOB", value: () => "Motor", cls: "font-bold text-slate-700" },
  { label: "Category", key: "categories" },
  { label: "Product Type", key: "product_type" },
  { label: "IDV / Sum Insured", value: (policy) => Number(policy.idv || 0).toLocaleString(), cls: "font-bold text-slate-700" },
  { label: "OD Premium", value: (policy) => formatCurrency(policy.total_od), cls: "font-bold text-slate-700" },
  { label: "TP Premium", value: (policy) => formatCurrency(policy.total_tp), cls: "font-bold text-slate-700" },
  { label: "NET Premium", value: (policy) => formatCurrency(policy.net_premium), cls: "font-extrabold text-slate-800" },
  { label: "Issue Date", key: "issue_date", isDate: true },
  { label: "Start Date", key: "start_date", isDate: true },
  { label: "OD Expiry Date", key: "od_expiry", isDate: true },
  { label: "TP Expiry Date", key: "tp_expiry", isDate: true },
  { label: "Registration Date", value: () => "N/A" },
  { label: "Vehicle No", key: "registration_number", cls: "font-bold text-slate-700" },
  { label: "Engine No / Chasis No", value: (policy) => [policy.engine_number, policy.chassis_number].filter(Boolean).join(" / ") || "N/A" },
  { label: "Contact", key: "contact" },
  { label: "Address", key: "address", cls: "max-w-[280px] truncate" },
  { label: "City / State", value: () => "N/A", cls: "font-bold text-slate-700" },
  { label: "Pin Code", value: () => "N/A", cls: "font-bold text-slate-700" },
];

const getColumnValue = (policy, column) => {
  if (column.value) return column.value(policy);
  if (column.isDate) return formatApiDate(policy[column.key]);
  return policy[column.key] || "N/A";
};

function FollowupModal({ policy, onClose, onSaved }) {
  const [form, setForm] = useState({
    followupDate: today(),
    nextFollowupDate: "",
    contactMode: "Call",
    disposition: "Contacted",
    status: "Open",
    remarks: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await departmentApi.createFollowup("renewal", {
        policyId: policy.policyId,
        policyNumber: policy.policyNumber || policy.policy_number,
        ...form,
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to save follow-up.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-3">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Policy Follow-up</p>
            <h2 className="mt-1 truncate text-lg font-black text-slate-900">{policy.policyNumber || policy.policy_number}</h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">{policy.insuredName || policy.insured_name || "Insured"} · Renewal {policy.renewalDate || "—"}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700" aria-label="Close follow-up form">
            <X size={18}/>
          </button>
        </div>
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Follow-up Date</span>
            <input name="followupDate" type="date" value={form.followupDate} onChange={change} required className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"/>
          </label>
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Next Follow-up</span>
            <input name="nextFollowupDate" type="date" value={form.nextFollowupDate} onChange={change} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"/>
          </label>
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Contact Mode</span>
            <ReusableSelect name="contactMode" value={form.contactMode} onChange={change}>
              {["Call", "WhatsApp", "Email", "Visit", "Other"].map((value) => <option key={value}>{value}</option>)}
            </ReusableSelect>
          </label>
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Disposition</span>
            <ReusableSelect name="disposition" value={form.disposition} onChange={change}>
              {["Contacted", "Not Reachable", "Quoted", "Interested", "Not Interested", "Renewed", "Lost"].map((value) => <option key={value}>{value}</option>)}
            </ReusableSelect>
          </label>
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Status</span>
            <ReusableSelect name="status" value={form.status} onChange={change}>
              {["Open", "Scheduled", "Closed"].map((value) => <option key={value}>{value}</option>)}
            </ReusableSelect>
          </label>
          <label className="relative block pt-2 sm:col-span-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Remarks</span>
            <textarea name="remarks" value={form.remarks} onChange={change} rows={4} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"/>
          </label>
          {error && <p className="text-xs font-bold text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold uppercase text-slate-600">Cancel</button>
            <button disabled={busy} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold uppercase text-white disabled:opacity-50">{busy ? "Saving" : "Save Follow-up"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RenewalPolicyTable({ rows = [], lapsedOnly = false }) {
  const [modalPolicy, setModalPolicy] = useState(null);
  const now = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [companiesList, setCompaniesList] = useState([]);
  const [fetchedRows, setFetchedRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    accountsApi.companies()
      .then((data) => setCompaniesList(Array.isArray(data) ? data.filter(c => c.status === "Active") : []))
      .catch(() => {});
  }, []);

  const requestParams = useMemo(() => {
    const params = lapsedOnly
      ? { type: "lapsed", month: selectedMonth, year: selectedYear }
      : { type: "upcoming" };
    if (selectedCompany && selectedCompany !== "All") {
      params.insurance_company = selectedCompany;
    }
    return params;
  }, [lapsedOnly, selectedMonth, selectedYear, selectedCompany]);

  const reloadRows = () => departmentApi.renewals("renewal", requestParams).then(setFetchedRows).catch(() => {});
  useEffect(() => {
    let active = true;
    departmentApi.renewals("renewal", requestParams)
      .then((nextRows) => {
        if (active) {
          setError("");
          setFetchedRows(nextRows);
        }
      })
      .catch((requestError) => {
        if (active) {
          setFetchedRows([]);
          setError(requestError.response?.data?.message || "Unable to load renewal policies.");
        }
      });
    return () => { active = false; };
  }, [requestParams]);
  const policyRows = fetchedRows || rows;
  const visibleRows = useMemo(() => policyRows.filter((row) => lapsedOnly ? row.status === "Lapsed" : row.status === "Upcoming"), [lapsedOnly, policyRows]);
  const columns = useMemo(() => [
    ...OPERATION_RENEWAL_COLUMNS.map((column, index) => ({
      key: column.key || `computed_${index}`,
      label: column.label,
      searchValue: (policy) => getColumnValue(policy, column),
      cellClassName: `px-2 py-2 text-[10px] sm:px-3 sm:py-3 ${column.cls || "whitespace-nowrap font-semibold text-slate-600"}`,
      render: (_, policy) => {
        const value = getColumnValue(policy, column);
        return <span title={String(value)}>{value}</span>;
      },
    })),
    {
      key: "action",
      label: "Action",
      render: (_, row) => row.policyId ? (
        <button type="button" onClick={() => setModalPolicy(row)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold uppercase text-white">
          <MessageSquarePlus size={13}/> Create Follow Up
        </button>
      ) : "—",
    },
  ], []);

  const companyFilter = {
    name: "insurance_company",
    label: "Insurance Company",
    render: (
      <ReusableSelect value={selectedCompany} onChange={(event) => setSelectedCompany(event.target.value)}>
        <option value="All">All Companies</option>
        {companiesList.map((company) => (
          <option key={company.id} value={company.insurer}>
            {company.insurer}
          </option>
        ))}
      </ReusableSelect>
    ),
  };

  const tableFilters = lapsedOnly ? [
    {
      name: "lapsed-period",
      render: <MonthYearPicker
        label="Lapsed Month"
        month={selectedMonth}
        year={selectedYear}
        clearable={false}
        onChange={(nextMonth, nextYear) => {
          setSelectedMonth(nextMonth);
          setSelectedYear(nextYear);
        }}
      />,
    },
    companyFilter
  ] : [companyFilter];

  return (
    <>
      <ReusableTable
        title={lapsedOnly ? "Lapsed Policy" : "Upcoming Policy"}
        subtitle={lapsedOnly ? "Expired renewals that need action" : "Policies due for renewal"}
        icon={lapsedOnly ? TriangleAlert : RefreshCw}
        rows={visibleRows}
        columns={columns}
        filters={tableFilters}
        pageSize={20}
        pageSizeOptions={[20, 50, 100]}
        error={error}
        emptyMessage={lapsedOnly ? "No lapsed policies found." : "No upcoming policies found."}
      />
      {modalPolicy && <FollowupModal policy={modalPolicy} onClose={() => setModalPolicy(null)} onSaved={() => {
        setModalPolicy(null);
        reloadRows();
      }}/>}
    </>
  );
}
