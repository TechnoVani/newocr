import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, BriefcaseBusiness, ContactRound, RefreshCw, Users } from "lucide-react";
import ReusableTable from "../../components/reusable/ReusableTable";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import DepartmentDashboardPage from "../shared/pages/DepartmentDashboardPage";
import { departmentApi } from "../shared/departmentApi";

const currency = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const posColumns = [
  { key: "pos_name", label: "POS Name", render: (_, row) => <div><p className="font-bold text-slate-800">{row.pos_name}</p><p className="text-[10px] text-slate-400">{row.pos_code}</p></div> },
  { key: "relationship_manager", label: "Relationship Manager" },
  { key: "policy_count", label: "Policies" },
  { key: "total_od", label: "OD Premium", render: currency },
  { key: "total_tp", label: "TP Premium", render: currency },
  { key: "net_premium", label: "Net Premium", render: currency },
  { key: "gross_premium", label: "Total Payable Premium", render: currency },
  { key: "od_income", label: "POS OD Income", render: currency },
  { key: "tp_income", label: "POS TP Income", render: currency },
  { key: "net_income", label: "POS Net Income", render: currency },
  { key: "total_income", label: "Total POS Income", render: value => <span className="font-black text-blue-700">{currency(value)}</span> },
];
const employeeColumns = [
  { key: "employee_name", label: "Employee / Relationship Manager", render: (_, row) => <div><p className="font-bold text-slate-800">{row.employee_name}</p><p className="text-[10px] text-slate-400">{row.employee_code}</p></div> },
  { key: "pos_count", label: "Managed POS" },
  { key: "policy_count", label: "Policies" },
  { key: "total_od", label: "OD Premium", render: currency },
  { key: "total_tp", label: "TP Premium", render: currency },
  { key: "net_premium", label: "Net Premium", render: currency },
  { key: "gross_premium", label: "Total Payable Premium", render: currency },
  { key: "od_income", label: "Attributed OD Income", render: currency },
  { key: "tp_income", label: "Attributed TP Income", render: currency },
  { key: "net_income", label: "Attributed Net Income", render: currency },
  { key: "total_income", label: "Attributed POS Income", render: value => <span className="font-black text-blue-700">{currency(value)}</span> },
];
const posMonthColumns = months => [
    { key: "pos_name", label: "POS Name", render: (_, row) => <div><p className="font-bold text-slate-800">{row.pos_name}</p><p className="text-[10px] text-slate-400">{row.pos_code}</p></div> },
    { key: "mobile", label: "Mobile Number" },
    { key: "pos_status", label: "POS Status" },
    { key: "relationship_manager", label: "Relationship Manager" },
    {
      key: "has_business",
      label: "Business Status",
      searchValue: row => row.has_business ? "Business" : "N/A",
      render: value => value
        ? <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 font-black text-emerald-700">Business</span>
        : <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 font-black text-red-700">N/A</span>,
    },
    ...months.map(({ key, label }) => ({
      key: `month_${key}`,
      label,
      render: (_, row) => {
        const values = row.months?.[key];
        if (!values?.policy_count) return <span className="inline-flex min-w-12 justify-center rounded-md bg-red-50 px-2 py-1 font-black text-red-600 ring-1 ring-inset ring-red-100">N/A</span>;
        return <div className="min-w-28 space-y-0.5 whitespace-normal rounded-md bg-blue-50/60 p-1.5 text-[9px]">
          <p><span className="text-slate-400">Count:</span> <b className="text-slate-800">{values.policy_count}</b></p>
          <p><span className="text-slate-400">Net:</span> <b className="text-slate-700">{currency(values.net_premium)}</b></p>
          <p><span className="text-slate-400">Gross:</span> <b className="text-slate-700">{currency(values.gross_premium)}</b></p>
          <p><span className="text-slate-400">Given Comm:</span> <b className="text-blue-700">{currency(values.total_income)}</b></p>
        </div>;
      },
    })),
  ];

export default function AdministrationDashboard({ data, department, reportView = "dashboard", toolbar, loading = false, error = "" }) {
  const reports = data?.businessReports || {};
  const summary = reports.summary || {};
  const [businessFilter, setBusinessFilter] = useState("all");
  const dashboardView = reportView === "dashboard";
  const showPos = dashboardView || reportView === "pos";
  const showPosMonth = reportView === "pos-month";
  const showEmployees = dashboardView || reportView === "employee";
  const monthRows = useMemo(() => {
    const rows = reports.all_pos || [];
    if (businessFilter === "business") return rows.filter((row) => row.has_business);
    if (businessFilter === "na") return rows.filter((row) => !row.has_business);
    return rows;
  }, [businessFilter, reports.all_pos]);
  const cards = [
    { label: "POS Count", value: showPosMonth ? summary.all_pos_count || 0 : summary.pos_count || 0, detail: `${summary.policy_count || 0} policies`, icon: ContactRound, tone: "bg-blue-50 text-blue-700" },
    { label: "Relationship Managers", value: summary.employee_count || 0, detail: "Policy business owners", icon: Users, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Net Premium", value: currency(summary.net_premium), detail: reports.period?.label || "Current month", icon: BriefcaseBusiness, tone: "bg-violet-50 text-violet-700" },
    { label: "Total POS Income", value: currency(summary.total_income), detail: "OD + TP + Net income", icon: BadgeIndianRupee, tone: "bg-amber-50 text-amber-700" },
  ];

  return <div className="space-y-4">
    {dashboardView && <DepartmentDashboardPage data={data} department={department}/>}
    {toolbar}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
    <section>
      <div className="mb-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Policy business · {reports.period?.label || "Current Month"}</p>
        <h2 className="mt-1 text-lg font-black text-slate-900">
          {reportView === "pos" ? "Complete POS-wise Business and Income Report" : reportView === "pos-month" ? "Complete POS Monthly Business Report" : reportView === "employee" ? "Complete Employee-wise Policy Business Report" : "POS and Employee Business Overview"}
        </h2>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {reportView === "pos" ? "Policy business is grouped by policies.pos_id, with OD, TP and Net POS income." : reportView === "pos-month" ? "Every POS record is shown and matched with policies for the selected issue month." : "Employee business is assigned from each policy’s POS relationship manager."}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon, tone }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 truncate text-xl font-black text-slate-900">{value}</p><p className="mt-0.5 text-[11px] font-semibold text-slate-500">{detail}</p></div>
            <span className={`rounded-lg p-2.5 ${tone}`}><Icon size={18}/></span>
          </div>
        </article>)}
      </div>
    </section>
    {showPos && <ReusableTable
      title="POS-wise Business and Income Report"
      subtitle={reports.period?.label || "Current Month"}
      rows={reports.pos || []}
      columns={posColumns}
      pageSize={10}
      loading={loading}
      emptyMessage="No POS policy business found for the current month."
    />}
    {showEmployees && <ReusableTable
      title="Employee-wise Policy Business Report"
      subtitle="Grouped by POS relationship manager"
      rows={reports.employees || []}
      columns={employeeColumns}
      pageSize={10}
      loading={loading}
      emptyMessage="No relationship-manager policy business found for the current month."
    />}
    {showPosMonth && <ReusableTable
      title="Complete POS Month Report"
      subtitle={`${reports.period?.fiscal_label || "Financial Year"} · April to March · All POS records`}
      rows={monthRows}
      columns={posMonthColumns(reports.period?.months || [])}
      filters={[{
        name: "business_status",
        label: "Business Status",
        value: businessFilter,
        options: [
          { value: "all", label: "All POS" },
          { value: "business", label: `Business (${summary.business_pos_count || 0})` },
          { value: "na", label: `N/A (${summary.no_business_pos_count || 0})` },
        ],
        clearable: false,
        onChange: event => setBusinessFilter(event.target.value),
      }]}
      pageSize={10}
      loading={loading}
      emptyMessage={businessFilter === "business"
        ? "No POS business is available for this financial year."
        : businessFilter === "na"
          ? "Every POS has business for this financial year."
          : "No POS records are available."}
    />}
  </div>;
}

function MonthlyBusinessReport({ reportView, ...props }) {
  const today = new Date();
  const initialMonth = props.data?.businessReports?.period?.key
    || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(initialMonth);
  const [reportData, setReportData] = useState(props.data);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    departmentApi.dashboard(props.department.slug, { month })
      .then((nextData) => { if (active) setReportData(nextData); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load the selected monthly business report.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, props.department.slug]);

  const [year, selectedMonth] = month.split("-").map(Number);
  const toolbar = <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{reportView === "employee" ? "Employee Monthly Report" : "POS Monthly Report"}</p>
      <p className="mt-1 text-sm font-semibold text-slate-600">Select the policy issue month to refresh the complete {reportView === "employee" ? "employee" : "POS"} business and income report.</p>
    </div>
    <div className="flex items-center gap-3">
      {loading && <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><RefreshCw size={14} className="animate-spin"/>Loading</span>}
      <MonthYearPicker
        label="Policy Issue Month"
        month={selectedMonth}
        year={year}
        clearable={false}
        onChange={(nextMonth, nextYear) => {
          setLoading(true);
          setError("");
          setMonth(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
        }}
      />
    </div>
  </section>;

  return <AdministrationDashboard {...props} data={reportData} reportView={reportView} toolbar={toolbar} loading={loading} error={error}/>;
}

export function PosBusinessReport(props) {
  return <MonthlyBusinessReport {...props} reportView="pos"/>;
}

export function EmployeeBusinessReport(props) {
  return <MonthlyBusinessReport {...props} reportView="employee"/>;
}

export function PosMonthReport(props) {
  return <MonthlyBusinessReport {...props} reportView="pos-month"/>;
}
