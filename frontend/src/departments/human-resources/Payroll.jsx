import { useEffect, useState } from "react";
import { Banknote, TrendingUp } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const month = new Date().toISOString().slice(0, 7);
const PAYROLL_EMPTY = { employee_id:"", payroll_month:month, basic:"", hra:"", allowances:"", bonus:"", deductions:"", tax:"", payment_status:"Draft", payment_date:"", notes:"" };
const INCREMENT_EMPTY = { employee_id:"", effective_date:"", previous_ctc:"", revised_ctc:"", reason:"", status:"Proposed" };
const PAYOUT_EMPTY = { employee_id:"", payout_month:month, payout_type:"Incentive", amount:"", payout_status:"Draft", payout_date:"", reference_number:"", notes:"" };
const currency = value => `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

export default function Payroll({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState([]);
  const [increments, setIncrements] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [payroll, setPayroll] = useState(PAYROLL_EMPTY);
  const [increment, setIncrement] = useState(INCREMENT_EMPTY);
  const [payout, setPayout] = useState(PAYOUT_EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => Promise.all([hrApi.payroll(), hrApi.increments(), hrApi.payouts()])
    .then(([pay, inc, payoutRows]) => { setRows(pay); setIncrements(inc); setPayouts(payoutRows); })
    .catch((error) => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load payroll." }));
  useEffect(() => { load(); }, []);
  const employeeOptions = (options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>);
  const submitPayroll = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.savePayroll(payroll); setPayroll(PAYROLL_EMPTY); await load(); refresh();
      setMessage({ type: "success", text: "Payroll saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save payroll." });
    }
  };
  const submitIncrement = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createIncrement(increment); setIncrement(INCREMENT_EMPTY); await load(); refresh();
      setMessage({ type: "success", text: "Increment saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save increment." });
    }
  };
  const submitPayout = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createPayout(payout); setPayout(PAYOUT_EMPTY); await load(); refresh();
      setMessage({ type: "success", text: "Employee payout created successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to create employee payout." });
    }
  };
  const payrollChange = event => setPayroll(current => ({ ...current, [event.target.name]: event.target.value }));
  const incrementChange = event => setIncrement(current => ({ ...current, [event.target.name]: event.target.value }));
  const payoutChange = event => setPayout(current => ({ ...current, [event.target.name]: event.target.value }));
  const setPayrollMonth = (nextMonth, nextYear) => setPayroll(current => ({
    ...current,
    payroll_month: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
  }));
  const setPayoutMonth = (nextMonth, nextYear) => setPayout(current => ({
    ...current,
    payout_month: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
  }));
  return <div className="space-y-5">
    {canManage && <div className="grid gap-5 xl:grid-cols-2">
      <ReusableForm title="Process Monthly Payroll" icon={Banknote} onSubmit={submitPayroll} showActions={false} gridClassName="sm:grid-cols-2">
        <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={payroll.employee_id} onChange={payrollChange} required><option value="">Select employee</option>{employeeOptions}</ReusableSelect></label>
        <MonthYearPicker label="Payroll Month" month={Number(payroll.payroll_month.slice(5, 7))} year={Number(payroll.payroll_month.slice(0, 4))} clearable={false} onChange={setPayrollMonth}/>
        {["basic","hra","allowances","bonus","deductions","tax"].map(name => <label key={name} className={formLabelClass}><span className={formLabelTextClass}>{name} *</span><input name={name} type="number" min="0" step="0.01" value={payroll[name]} onChange={payrollChange} className={formControlClass} required/></label>)}
        <label className={formLabelClass}><span className={formLabelTextClass}>Payment Status</span><ReusableSelect name="payment_status" value={payroll.payment_status} onChange={payrollChange}>{["Draft","Processed","Paid","On Hold"].map(value => <option key={value}>{value}</option>)}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Payment Date</span><input name="payment_date" type="date" value={payroll.payment_date} onChange={payrollChange} className={formControlClass}/></label>
        <button className="h-11 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white">Save Payroll</button>
      </ReusableForm>
      <ReusableForm title="Salary Increment" icon={TrendingUp} onSubmit={submitIncrement} showActions={false} gridClassName="sm:grid-cols-2">
        <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={increment.employee_id} onChange={incrementChange} required><option value="">Select employee</option>{employeeOptions}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Effective Date *</span><input name="effective_date" type="date" value={increment.effective_date} onChange={incrementChange} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Previous Annual CTC *</span><input name="previous_ctc" type="number" min="0" value={increment.previous_ctc} onChange={incrementChange} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Revised Annual CTC *</span><input name="revised_ctc" type="number" min="0" value={increment.revised_ctc} onChange={incrementChange} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Status</span><ReusableSelect name="status" value={increment.status} onChange={incrementChange}>{["Proposed","Approved","Effective","Rejected"].map(value => <option key={value}>{value}</option>)}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Reason</span><input name="reason" value={increment.reason} onChange={incrementChange} className={formControlClass}/></label>
        <button className="h-11 rounded-xl bg-blue-600 px-5 text-xs font-bold uppercase text-white">Save Increment</button>
      </ReusableForm>
    </div>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    {canManage && <ReusableForm title="Create Employee Payout" icon={Banknote} onSubmit={submitPayout} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
      <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={payout.employee_id} onChange={payoutChange} required><option value="">Select employee</option>{employeeOptions}</ReusableSelect></label>
      <MonthYearPicker label="Payout Month" month={Number(payout.payout_month.slice(5, 7))} year={Number(payout.payout_month.slice(0, 4))} clearable={false} onChange={setPayoutMonth}/>
      <label className={formLabelClass}><span className={formLabelTextClass}>Payout Type *</span><ReusableSelect name="payout_type" value={payout.payout_type} onChange={payoutChange}>{["Salary","Incentive","Bonus","Reimbursement","Settlement","Other"].map(value => <option key={value}>{value}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Amount *</span><input name="amount" type="number" min="0.01" step="0.01" value={payout.amount} onChange={payoutChange} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Payout Status *</span><ReusableSelect name="payout_status" value={payout.payout_status} onChange={payoutChange}>{["Draft","Approved","Paid","On Hold","Cancelled"].map(value => <option key={value}>{value}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Payout Date</span><input name="payout_date" type="date" value={payout.payout_date} onChange={payoutChange} className={formControlClass}/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Reference Number</span><input name="reference_number" value={payout.reference_number} onChange={payoutChange} className={formControlClass}/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Notes</span><input name="notes" value={payout.notes} onChange={payoutChange} className={formControlClass}/></label>
      <button className="h-11 rounded-xl bg-cyan-600 px-5 text-xs font-bold uppercase text-white">Create Payout</button>
    </ReusableForm>}
    <ReusableTable title="Payroll Register" rows={rows} columns={[
      {key:"payroll_month",label:"Month"},{key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},
      {key:"department",label:"Department"},{key:"basic",label:"Basic",render:currency},{key:"net_pay",label:"Net Pay",render:currency},{key:"payment_status",label:"Status"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
    <ReusableTable title="Increment History" rows={increments} columns={[
      {key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},{key:"effective_date",label:"Effective Date"},
      {key:"previous_ctc",label:"Previous CTC",render:currency},{key:"revised_ctc",label:"Revised CTC",render:currency},
      {key:"increment_percent",label:"Increment %"},{key:"status",label:"Status"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
    <ReusableTable title="Employee Payout Register" rows={payouts} columns={[
      {key:"payout_month",label:"Month"},{key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},
      {key:"department",label:"Department"},{key:"payout_type",label:"Payout Type"},
      {key:"amount",label:"Amount",render:currency},{key:"payout_status",label:"Status"},
      {key:"payout_date",label:"Payout Date"},{key:"reference_number",label:"Reference Number"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
  </div>;
}
