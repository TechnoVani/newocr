import { useEffect, useState } from "react";
import { CalendarDays, Check, X } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const EMPTY = { employee_id:"", leave_type_id:"", from_date:"", to_date:"", reason:"" };
export default function Leave({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState([]);
  const [balances, setBalances] = useState({ year: new Date().getFullYear(), rows: [] });
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => Promise.all([hrApi.leaves(), hrApi.leaveBalances()])
    .then(([requests, balanceData]) => { setRows(requests); setBalances(balanceData); });
  useEffect(() => { load(); }, []);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const run = async (action, success) => {
    setMessage({ type: "", text: "" });
    try {
      await action();
      await load();
      refresh();
      setMessage({ type: "success", text: success });
      return true;
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update leave management." });
      return false;
    }
  };
  const submit = async event => {
    event.preventDefault();
    const saved = await run(() => hrApi.createLeave(form), "Leave request submitted.");
    if (saved) setForm(EMPTY);
  };
  const decide = (id, status) => run(() => hrApi.decideLeave(id, status), `Leave request ${status.toLowerCase()}.`);
  const cancel = id => run(() => hrApi.cancelLeave(id), "Leave request cancelled.");
  return <div className="space-y-5">
    <ReusableForm title="Apply for Leave" icon={CalendarDays} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-5">
      {canManage && <label className={formLabelClass}><span className={formLabelTextClass}>Employee</span><ReusableSelect name="employee_id" value={form.employee_id} onChange={change}><option value="">My leave</option>{(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>}
      <label className={formLabelClass}><span className={formLabelTextClass}>Leave Type *</span><ReusableSelect name="leave_type_id" value={form.leave_type_id} onChange={change} required><option value="">Select leave type</option>{(options.leaveTypes || []).map(item => <option key={item.id} value={item.id}>{item.name} ({item.annual_quota} days)</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>From Date *</span><input name="from_date" type="date" value={form.from_date} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>To Date *</span><input name="to_date" type="date" min={form.from_date} value={form.to_date} onChange={change} className={formControlClass} required/></label>
      <label className={`${formLabelClass} ${canManage ? "" : "xl:col-span-2"}`}><span className={formLabelTextClass}>Reason *</span><input name="reason" value={form.reason} onChange={change} className={formControlClass} required/></label>
      <button className="h-11 rounded-xl bg-blue-600 px-5 text-xs font-bold uppercase text-white">Submit Leave</button>
    </ReusableForm>
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title={`Leave Balances · ${balances.year}`} rows={balances.rows || []} columns={[
      ...(canManage ? [{key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"}] : []),
      {key:"leave_type",label:"Leave Type"},{key:"annual_quota",label:"Annual Quota"},
      {key:"approved_days",label:"Approved"},{key:"pending_days",label:"Pending"},{key:"available_days",label:"Available"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
    <ReusableTable title="Leave Requests" rows={rows} columns={[
      {key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},{key:"leave_type",label:"Leave Type"},
      {key:"from_date",label:"From"},{key:"to_date",label:"To"},{key:"days",label:"Days"},{key:"reason",label:"Reason"},{key:"status",label:"Status"},
      {key:"action",label:"Action",render:(_,row) => row.status === "Pending" ? <div className="flex gap-1">
        {canManage && <button onClick={() => decide(row.id,"Approved")} className="rounded-lg bg-emerald-50 p-2 text-emerald-600" title="Approve"><Check size={15}/></button>}
        {canManage && <button onClick={() => decide(row.id,"Rejected")} className="rounded-lg bg-red-50 p-2 text-red-600" title="Reject"><X size={15}/></button>}
        <button onClick={() => cancel(row.id)} className="rounded-lg border border-slate-200 p-2 text-slate-500" title="Cancel"><X size={15}/></button>
      </div> : "—"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
  </div>;
}
