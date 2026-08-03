import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Save, UserRoundCheck } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import { hrApi } from "./hrApi";

const shiftEmpty = {
  shift_name: "", start_time: "09:30", end_time: "18:30",
  grace_minutes: "15", minimum_hours: "8", working_days: "Mon,Tue,Wed,Thu,Fri,Sat", status: "Active",
};
const assignmentEmpty = { employee_id: "", shift_id: "", effective_from: "", effective_to: "" };
const holidayEmpty = { holiday_date: "", holiday_name: "", holiday_type: "Company", notes: "" };

export default function WorkforceSetup({ options, refresh }) {
  const [data, setData] = useState({ shifts: [], assignments: [], holidays: [] });
  const [shift, setShift] = useState(shiftEmpty);
  const [assignment, setAssignment] = useState(assignmentEmpty);
  const [holiday, setHoliday] = useState(holidayEmpty);
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => hrApi.workforceSetup().then(setData)
    .catch(error => setMessage({ type: "error", text: error.response?.data?.message || "Unable to load workforce setup." }));
  useEffect(() => { load(); }, []);
  const run = async (action, success, reset) => {
    setMessage({ type: "", text: "" });
    try {
      await action();
      reset();
      await load();
      refresh();
      setMessage({ type: "success", text: success });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to save workforce setup." });
    }
  };
  const update = setter => event => setter(current => ({ ...current, [event.target.name]: event.target.value }));
  return <div className="space-y-5">
    <section className="grid gap-5 xl:grid-cols-3">
      <ReusableForm title="Create Work Shift" icon={Clock3} onSubmit={event => {
        event.preventDefault();
        run(() => hrApi.createShift(shift), "Work shift created.", () => setShift(shiftEmpty));
      }} showActions={false} gridClassName="sm:grid-cols-2">
        <label className={`${formLabelClass} sm:col-span-2`}><span className={formLabelTextClass}>Shift Name *</span><input name="shift_name" value={shift.shift_name} onChange={update(setShift)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Start Time *</span><input name="start_time" type="time" value={shift.start_time} onChange={update(setShift)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>End Time *</span><input name="end_time" type="time" value={shift.end_time} onChange={update(setShift)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Grace Minutes *</span><input name="grace_minutes" type="number" min="0" max="180" value={shift.grace_minutes} onChange={update(setShift)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Minimum Hours *</span><input name="minimum_hours" type="number" min="1" max="24" step="0.5" value={shift.minimum_hours} onChange={update(setShift)} className={formControlClass} required/></label>
        <label className={`${formLabelClass} sm:col-span-2`}><span className={formLabelTextClass}>Working Days *</span><input name="working_days" value={shift.working_days} onChange={update(setShift)} className={formControlClass} required/></label>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold uppercase text-white"><Save size={14}/>Create Shift</button>
      </ReusableForm>

      <ReusableForm title="Assign Employee Shift" icon={UserRoundCheck} onSubmit={event => {
        event.preventDefault();
        run(() => hrApi.assignShift(assignment), "Employee shift assigned.", () => setAssignment(assignmentEmpty));
      }} showActions={false}>
        <label className={formLabelClass}><span className={formLabelTextClass}>Employee *</span><ReusableSelect name="employee_id" value={assignment.employee_id} onChange={update(setAssignment)} required><option value="">Select employee</option>{(options.employees || []).map(item => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Active Shift *</span><ReusableSelect name="shift_id" value={assignment.shift_id} onChange={update(setAssignment)} required><option value="">Select shift</option>{data.shifts.filter(item => item.status === "Active").map(item => <option key={item.id} value={item.id}>{item.shift_name} · {item.start_time}-{item.end_time}</option>)}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Effective From *</span><input name="effective_from" type="date" value={assignment.effective_from} onChange={update(setAssignment)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Effective To</span><input name="effective_to" type="date" min={assignment.effective_from} value={assignment.effective_to} onChange={update(setAssignment)} className={formControlClass}/></label>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold uppercase text-white"><Save size={14}/>Assign Shift</button>
      </ReusableForm>

      <ReusableForm title="Create Holiday" icon={CalendarDays} onSubmit={event => {
        event.preventDefault();
        run(() => hrApi.createHoliday(holiday), "Holiday added.", () => setHoliday(holidayEmpty));
      }} showActions={false}>
        <label className={formLabelClass}><span className={formLabelTextClass}>Holiday Date *</span><input name="holiday_date" type="date" value={holiday.holiday_date} onChange={update(setHoliday)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Holiday Name *</span><input name="holiday_name" value={holiday.holiday_name} onChange={update(setHoliday)} className={formControlClass} required/></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Holiday Type *</span><ReusableSelect name="holiday_type" value={holiday.holiday_type} onChange={update(setHoliday)}>{["National","Company","Optional"].map(value => <option key={value}>{value}</option>)}</ReusableSelect></label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Notes</span><input name="notes" value={holiday.notes} onChange={update(setHoliday)} className={formControlClass}/></label>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold uppercase text-white"><Save size={14}/>Add Holiday</button>
      </ReusableForm>
    </section>
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title="Work Shift Master" rows={data.shifts} columns={[
      {key:"shift_name",label:"Shift"},{key:"start_time",label:"Start"},{key:"end_time",label:"End"},
      {key:"grace_minutes",label:"Grace Minutes"},{key:"minimum_hours",label:"Minimum Hours"},
      {key:"working_days",label:"Working Days"},{key:"status",label:"Status"},
    ]} pageSize={10} pageSizeOptions={[10,20,50]}/>
    <ReusableTable title="Employee Shift Assignment History" rows={data.assignments} columns={[
      {key:"employee_code",label:"Code"},{key:"employee_name",label:"Employee"},{key:"shift_name",label:"Shift"},
      {key:"effective_from",label:"Effective From"},{key:"effective_to",label:"Effective To"},{key:"status",label:"Status"},
    ]} pageSize={10} pageSizeOptions={[10,20,50]}/>
    <ReusableTable title="Holiday Calendar" rows={data.holidays} columns={[
      {key:"holiday_date",label:"Date"},{key:"holiday_name",label:"Holiday"},
      {key:"holiday_type",label:"Type"},{key:"status",label:"Status"},{key:"notes",label:"Notes"},
    ]} pageSize={10} pageSizeOptions={[10,20,50]}/>
  </div>;
}
