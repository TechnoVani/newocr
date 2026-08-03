import { useEffect, useState } from "react";
import { Banknote, CalendarCheck, IndianRupee, Star, UserCheck, Users } from "lucide-react";
import ReusableTable from "../../components/reusable/ReusableTable";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import { hrApi } from "./hrApi";

const now = new Date();
const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const currency = value => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

function Card({ label, value, detail, icon: Icon, tone }) {
  return <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <span className={`inline-flex rounded-xl p-3 ${tone}`}><Icon size={19}/></span>
    <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
    <p className="mt-1 text-2xl font-black text-slate-900">{value}</p>
    <p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p>
  </article>;
}

export default function Reports() {
  const [month, setMonth] = useState(initialMonth);
  const [report, setReport] = useState({ workforce: {}, attendance: {}, payroll: {}, payouts: {}, performance: {}, holidays: {}, departments: [] });
  const [error, setError] = useState("");
  useEffect(() => {
    hrApi.reports(month).then(setReport)
      .catch(requestError => setError(requestError.response?.data?.message || "Unable to load HR reports."));
  }, [month]);
  return <div className="space-y-5">
    <div className="flex justify-end">
      <MonthYearPicker label="Report Month" month={Number(month.slice(5, 7))} year={Number(month.slice(0, 4))} clearable={false}
        onChange={(nextMonth, nextYear) => {
          setError("");
          setMonth(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
        }}/>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</p>}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Card label="Total Employees" value={report.workforce?.total_employees || 0} detail={`${report.workforce?.active_employees || 0} active`} icon={Users} tone="bg-blue-50 text-blue-600"/>
      <Card label="Present Records" value={report.attendance?.present || 0} detail={`${report.attendance?.attendance_records || 0} attendance records`} icon={UserCheck} tone="bg-emerald-50 text-emerald-600"/>
      <Card label="Absent / Leave" value={Number(report.attendance?.absent || 0) + Number(report.attendance?.on_leave || 0)} detail={`${report.attendance?.work_hours || 0} total work hours`} icon={CalendarCheck} tone="bg-amber-50 text-amber-600"/>
      <Card label="Payroll Net" value={currency(report.payroll?.net_pay)} detail={`${report.payroll?.paid_records || 0} paid payroll records`} icon={Banknote} tone="bg-violet-50 text-violet-600"/>
      <Card label="Employee Payouts" value={currency(report.payouts?.payout_amount)} detail={`${report.payouts?.paid_payouts || 0} paid payouts`} icon={IndianRupee} tone="bg-cyan-50 text-cyan-600"/>
      <Card label="Average Performance" value={Number(report.performance?.average_rating || 0).toFixed(2)} detail={`${report.performance?.review_records || 0} performance reviews`} icon={Star} tone="bg-amber-50 text-amber-600"/>
    </section>
    <ReusableTable title="Department-wise Workforce Report" rows={report.departments || []} columns={[
      {key:"department",label:"Department"},{key:"total_employees",label:"Total Employees"},
      {key:"active_employees",label:"Active Employees"},{key:"inactive_employees",label:"Inactive Employees"},
    ]} pageSize={10} pageSizeOptions={[10,20,50]} emptyMessage="No department workforce data found."/>
  </div>;
}
