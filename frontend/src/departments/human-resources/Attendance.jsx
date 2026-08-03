import { useEffect, useState } from "react";
import { CalendarCheck, Save } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import MonthYearPicker from "../../pages/reusable/MonthYearPicker";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const empty = {
  employee_id: "",
  attendance_date: now.toISOString().slice(0, 10),
  attendance_status: "Present",
  check_in: "",
  check_out: "",
  notes: "",
};

export default function Attendance({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [month, setMonth] = useState(currentMonth);
  const [form, setForm] = useState(empty);
  const [data, setData] = useState({ rows: [] });
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => hrApi.attendance(month)
    .then(setData)
    .catch(error => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load attendance." }));
  useEffect(() => {
    let active = true;
    hrApi.attendance(month)
      .then(result => { if (active) setData(result); })
      .catch(error => {
        if (active) setMessage({ type: "error", text: error.response?.data?.message || "Unable to load attendance." });
      });
    return () => { active = false; };
  }, [month]);
  const change = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const submit = async event => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      await hrApi.saveAttendance(form);
      setForm(current => ({ ...empty, attendance_date: current.attendance_date }));
      await load();
      refresh();
      setMessage({ type: "success", text: "Attendance saved successfully." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save attendance." });
    }
  };
  return <div className="space-y-5">
    {canManage && <ReusableForm title="Mark Daily Attendance" icon={CalendarCheck} onSubmit={submit} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
      <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span>
        <ReusableSelect name="employee_id" value={form.employee_id} onChange={change} required>
          <option value="">Select employee</option>
          {(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}
        </ReusableSelect>
      </label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Attendance Date *</span><input name="attendance_date" type="date" value={form.attendance_date} onChange={change} className={formControlClass} required/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Status *</span>
        <ReusableSelect name="attendance_status" value={form.attendance_status} onChange={change}>
          {["Present","Absent","Half Day","Leave","Week Off","Holiday","Work From Home"].map(value => <option key={value}>{value}</option>)}
        </ReusableSelect>
      </label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Check In</span><input name="check_in" type="time" value={form.check_in} onChange={change} className={formControlClass}/></label>
      <label className={formLabelClass}><span className={formLabelTextClass}>Check Out</span><input name="check_out" type="time" value={form.check_out} onChange={change} className={formControlClass}/></label>
      <label className={`${formLabelClass} sm:col-span-2`}><span className={formLabelTextClass}>Notes</span><input name="notes" value={form.notes} onChange={change} className={formControlClass}/></label>
      <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Save Attendance</button>
    </ReusableForm>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable
      title="Monthly Attendance Register"
      rows={data.rows || []}
      columns={[
        {key:"attendance_date",label:"Date"},{key:"employee_code",label:"Employee Code"},
        {key:"employee_name",label:"Employee"},{key:"department",label:"Department"},
        {key:"shift_name",label:"Shift"},
        {key:"attendance_status",label:"Status"},{key:"check_in",label:"Check In"},
        {key:"check_out",label:"Check Out"},{key:"work_hours",label:"Work Hours"},{key:"notes",label:"Notes"},
      ]}
      filters={[{
        name: "month",
        render: <MonthYearPicker month={Number(month.slice(5, 7))} year={Number(month.slice(0, 4))} clearable={false}
          onChange={(nextMonth, nextYear) => setMonth(`${nextYear}-${String(nextMonth).padStart(2, "0")}`)}/>,
      }]}
      pageSize={10}
      pageSizeOptions={[10, 20, 50, 100]}
      emptyMessage="No attendance records for the selected month."
    />
  </div>;
}
