import { useEffect, useState } from "react";
import { Check, Save, Star } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const currentMonth = new Date().toISOString().slice(0, 7);
const empty = {
  employee_id: "", review_period: currentMonth, rating: "3", goals: "",
  achievements: "", strengths: "", improvement_areas: "", reviewer_feedback: "", status: "Draft",
};

export default function Performance({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => hrApi.performanceReviews().then(setRows)
    .catch(error => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load performance reviews." }));
  useEffect(() => { load(); }, []);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      await hrApi.savePerformanceReview(form);
      setForm(empty);
      await load();
      refresh();
      setMessage({ type: "success", text: "Performance review saved." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save performance review." });
    }
  };
  const updateStatus = async (id, status) => {
    try {
      await hrApi.updatePerformanceStatus(id, status);
      await load();
      refresh();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update review status." });
    }
  };
  const setReviewMonth = (nextMonth, nextYear) => setForm(current => ({
    ...current,
    review_period: `${nextYear}-${String(nextMonth).padStart(2, "0")}`,
  }));
  return <div className="space-y-5">
    {canManage && <ReusableForm title="Performance Review" icon={Star} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
      <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={form.employee_id} onChange={change} required><option value="">Select employee</option>{(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
      <MonthYearPicker label="Review Month" month={Number(form.review_period.slice(5, 7))} year={Number(form.review_period.slice(0, 4))} clearable={false} onChange={setReviewMonth}/>
      <label className={formLabelClass}><span className={formLabelTextClass}>Rating (1–5) *</span><input name="rating" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Status *</span><ReusableSelect name="status" value={form.status} onChange={change}><option>Draft</option><option>Submitted</option></ReusableSelect></label>
      {[
        ["goals","Goals"],["achievements","Achievements"],["strengths","Strengths"],
        ["improvement_areas","Improvement Areas"],["reviewer_feedback","Reviewer Feedback"],
      ].map(([name,label]) => <label key={name} className={`${formLabelClass} sm:col-span-2`}><span className={formLabelTextClass}>{label}</span><textarea name={name} value={form[name]} onChange={change} rows={3} className={`${formControlClass} h-auto py-3`}/></label>)}
      <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Save Review</button>
    </ReusableForm>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title="Performance Review Register" rows={rows} columns={[
      {key:"review_period",label:"Review Month"},{key:"employee_code",label:"Employee Code"},
      {key:"employee_name",label:"Employee"},{key:"department",label:"Department"},
      {key:"reviewer_name",label:"Reviewer"},{key:"rating",label:"Rating"},
      {key:"status",label:"Status"},{key:"reviewer_feedback",label:"Feedback"},
      {key:"action",label:"Action",render:(_,row) => row.status === "Submitted"
        ? <button type="button" onClick={() => updateStatus(row.id, canManage ? "Closed" : "Acknowledged")} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1.5 text-emerald-700"><Check size={14}/>{canManage ? "Close" : "Acknowledge"}</button>
        : "—"},
    ]} pageSize={10} pageSizeOptions={[10,20,50]} emptyMessage="No performance reviews found."/>
  </div>;
}
