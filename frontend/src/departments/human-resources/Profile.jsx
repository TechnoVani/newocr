import { useEffect, useMemo, useState } from "react";
import { Save, UserRoundCog } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import { hrApi } from "./hrApi";

const fields = [
  ["name","Employee Name","text"],["personal_email","Personal Email","email"],
  ["mobile","Mobile Number","tel"],["date_of_birth","Date of Birth","date"],
  ["emergency_contact","Emergency Contact","tel"],["joining_date","Joining Date","date"],
  ["state","State","text"],["city","City","text"],["pin_code","PIN Code","text"],
];

export default function Profile({ options, refresh }) {
  const [employeeId, setEmployeeId] = useState("");
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  useEffect(() => {
    if (!employeeId) return;
    hrApi.employeeProfile(employeeId).then(setForm)
      .catch(error => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load employee profile." }));
  }, [employeeId]);
  const designations = useMemo(() => (options.designations || []).filter(item =>
    String(item.department_id) === String(form?.department_id)), [form?.department_id, options.designations]);
  const change = event => setForm(current => ({
    ...current,
    [event.target.name]: event.target.value,
    ...(event.target.name === "department_id" ? { designation_id: "" } : {}),
  }));
  const submit = async event => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      const saved = await hrApi.updateEmployeeProfile(employeeId, {
        ...form,
        department: form.department_id,
        designation: form.designation_id,
        reporting_manager: form.reporting_manager_id,
        relationship_manager: form.relationship_manager_id,
      });
      setForm(saved);
      refresh();
      setMessage({ type: "success", text: "Employee profile updated successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update employee profile." });
    }
  };
  return <div className="space-y-5">
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <label className={formLabelClass}><span className={formLabelTextClass}>Select Employee Profile</span>
        <ReusableSelect value={employeeId} onChange={event => {
          setForm(null);
          setMessage({ type: "", text: "" });
          setEmployeeId(event.target.value);
        }}>
          <option value="">Select employee</option>
          {(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}
        </ReusableSelect>
      </label>
    </div>
    {form && <ReusableForm title={`${form.employee_code} · ${form.name}`} icon={UserRoundCog} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
      {fields.map(([name,label,type]) => <label key={name} className={formLabelClass}><span className={formLabelTextClass}>{label} *</span>
        <input name={name} type={type} value={form[name] || ""} onChange={change} className={formControlClass} required={["name","personal_email","mobile","joining_date"].includes(name)}/>
      </label>)}
      <label className={formLabelClass}><span className={formLabelTextClass}>Gender</span><ReusableSelect name="gender" value={form.gender || ""} onChange={change}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Department *</span><ReusableSelect name="department_id" value={form.department_id || ""} onChange={change} required><option value="">Select department</option>{(options.departments || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Designation *</span><ReusableSelect name="designation_id" value={form.designation_id || ""} onChange={change} required><option value="">Select designation</option>{designations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Reporting Manager</span><ReusableSelect name="reporting_manager_id" value={form.reporting_manager_id || ""} onChange={change}><option value="">No reporting manager</option>{(options.reportingManagers || []).filter(item => String(item.id) !== String(employeeId)).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Relationship Manager</span><ReusableSelect name="relationship_manager_id" value={form.relationship_manager_id || ""} onChange={change}><option value="">No relationship manager</option>{(options.relationshipManagers || []).filter(item => String(item.id) !== String(employeeId)).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
      <label className={`${formLabelClass} sm:col-span-2 xl:col-span-4`}><span className={formLabelTextClass}>Current Address</span><textarea name="current_address" value={form.current_address || ""} onChange={change} rows={3} className={`${formControlClass} h-auto py-3`}/></label>
      <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Update Profile</button>
      {message.text && <p className={`sm:col-span-full text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    </ReusableForm>}
    {!form && message.text && <p role="alert" className="text-xs font-bold text-red-600">{message.text}</p>}
  </div>;
}
