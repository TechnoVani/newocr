import { useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const TYPES = ["Onboarding","Probation","Confirmation","Transfer","Promotion","Resignation","Termination","Relieving","Retirement","Other"];
const EMPTY = { employee_id:"", event_type:"Onboarding", event_date:"", status:"Planned", notes:"", document_id:"" };
export default function Lifecycle({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => Promise.all([hrApi.events(), hrApi.documents()])
    .then(([events, docs]) => { setRows(events); setDocuments(docs); })
    .catch((error) => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load lifecycle records." }));
  useEffect(() => { load(); }, []);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createEvent(form); setForm(EMPTY); await load(); refresh();
      setMessage({ type: "success", text: "Lifecycle event saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save lifecycle event." });
    }
  };
  return <div className="space-y-5">
    {canManage && <ReusableForm title="Employee Lifecycle Event" icon={GitBranch} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-5">
      <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={form.employee_id} onChange={change} required><option value="">Select employee</option>{(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Event Type *</span><ReusableSelect name="event_type" value={form.event_type} onChange={change}>{TYPES.map(type => <option key={type}>{type}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Event Date *</span><input name="event_date" type="date" value={form.event_date} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Status *</span><ReusableSelect name="status" value={form.status} onChange={change}>{["Planned","In Progress","Completed","Cancelled"].map(status => <option key={status}>{status}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Linked Letter</span><ReusableSelect name="document_id" value={form.document_id} onChange={change}><option value="">No linked letter</option>{documents.filter(item => !form.employee_id || String(item.employee_id) === String(form.employee_id)).map(item => <option key={item.id} value={item.id}>{item.document_number} · {item.document_type}</option>)}</ReusableSelect></label>
      <label className={`${formLabelClass} sm:col-span-2 xl:col-span-4`}><span className={formLabelTextClass}>Notes</span><input name="notes" value={form.notes} onChange={change} className={formControlClass}/></label>
      <button className="h-11 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white">Save Lifecycle Event</button>
    </ReusableForm>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title="Employee Lifecycle Register" rows={rows} columns={[
      {key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},{key:"event_type",label:"Event"},
      {key:"event_date",label:"Date"},{key:"status",label:"Status"},{key:"document_number",label:"Linked Document"},{key:"notes",label:"Notes"},
    ]} pageSize={20} pageSizeOptions={[20,50,100]}/>
  </div>;
}
