import { useEffect, useMemo, useState } from "react";
import { Save, ToggleLeft, ToggleRight, Users } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableSearchSelect from "../../components/reusable/ReusableSearchSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import { getCityOptions, INDIAN_STATE_OPTIONS } from "../../config/indiaLocations";
import { hrApi } from "./hrApi";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";

const EMPTY = {
  name: "", personal_email: "", mobile: "", password: "", user_type: "Employee",
  department: "", designation: "", reporting_manager: "", relationship_manager: "",
  joining_date: "", status: "Active", gender: "", date_of_birth: "",
  emergency_contact: "", current_address: "", state: "", city: "", pin_code: "",
};

export default function EmployeesPage({ rows: initialRows = [] }) {
  const { user } = useAuth();
  const canManageEmployees = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [rows, setRows] = useState(initialRows);
  const [options, setOptions] = useState({ departments: [], designations: [] });
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [manualCity, setManualCity] = useState(false);

  const load = async () => {
    const [employees, hrOptions] = await Promise.all([
      hrApi.employees(),
      canManageEmployees ? hrApi.options() : Promise.resolve({ departments: [], designations: [], employees: [] }),
    ]);
    setRows(employees || []);
    setOptions(hrOptions || { departments: [], designations: [] });
  };
  useEffect(() => {
    let active = true;
    Promise.all([
      hrApi.employees(),
      canManageEmployees ? hrApi.options() : Promise.resolve({ departments: [], designations: [], employees: [] }),
    ])
      .then(([employees, hrOptions]) => {
        if (active) {
          setRows(employees || []);
          setOptions(hrOptions || { departments: [], designations: [] });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [canManageEmployees]);

  const designations = useMemo(
    () => options.designations.filter((item) =>
      String(item.department_id) === String(form.department) && item.status !== "Inactive"),
    [form.department, options.designations],
  );
  const cityOptions = useMemo(() => getCityOptions(form.state), [form.state]);
  const selectedState = INDIAN_STATE_OPTIONS.find(option => option.value === form.state) || null;
  const selectedCity = cityOptions.find(option => option.value === form.city) || null;
  const change = (event) => setForm((current) => ({
    ...current,
    [event.target.name]: event.target.value,
    ...(event.target.name === "department" ? { designation: "" } : {}),
  }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.state || !form.city) {
      setMessage({ type: "error", text: "State and city are required. Enter the city manually if it is not listed." });
      return;
    }
    setSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await hrApi.createEmployee(form);
      await load();
      setForm(EMPTY);
      setManualCity(false);
      setMessage({ type: "success", text: "Employee created and portal access is ready." });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to create employee." });
    } finally {
      setSubmitting(false);
    }
  };
  const changeStatus = async (employee) => {
    const status = employee.status === "Active" ? "Inactive" : "Active";
    setMessage({ type: "", text: "" });
    try {
      await hrApi.updateEmployeeStatus(employee.id, status);
      await load();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to update employee status." });
    }
  };
  const columns = [
    { key: "employee_code", label: "Employee Code" },
    { key: "name", label: "Employee Name" },
    { key: "designation", label: "Designation" },
    { key: "department", label: "Department" },
    { key: "reporting_manager_name", label: "Reporting Manager" },
    { key: "relationship_manager_name", label: "Relationship Manager" },
    { key: "joining_date", label: "Joining Date" },
    { key: "status", label: "Status" },
    ...(canManageEmployees ? [{ key: "action", label: "Action", render: (_, row) => (
      <button type="button" onClick={() => changeStatus(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50" title={row.status === "Active" ? "Deactivate employee" : "Activate employee"}>
        {row.status === "Active" ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
      </button>
    ) }] : []),
  ];

  return (
    <div className="space-y-5">
      {canManageEmployees && <ReusableForm title="Create Employee" icon={Users} onSubmit={submit} onReset={() => { setForm(EMPTY); setManualCity(false); }} showActions={false} gridClassName="sm:grid-cols-2 xl:grid-cols-4">
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Next Employee Code</span>
          <input value={options.nextEmployeeCode || "Generated automatically"} className={`${formControlClass} bg-slate-50 font-bold text-blue-700`} readOnly />
        </label>
        {[
          ["name", "Employee Name", "text"], ["personal_email", "Personal Email", "email"],
          ["mobile", "Mobile Number", "tel"], ["password", "Initial Password", "password"],
          ["joining_date", "Joining Date", "date"], ["date_of_birth", "Date of Birth", "date"],
          ["emergency_contact", "Emergency Contact", "tel"], ["pin_code", "PIN Code", "text"],
        ].map(([name, label, type]) => (
          <label key={name} className={formLabelClass}>
            <span className={formLabelTextClass}>{label} *</span>
            <input name={name} type={type} value={form[name]} onChange={change} className={formControlClass} required />
          </label>
        ))}
        <label className={formLabelClass}><span className={formLabelTextClass}>Department *</span>
          <ReusableSelect name="department" value={form.department} onChange={change} required><option value="">Select department</option>{options.departments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Designation *</span>
          <ReusableSelect name="designation" value={form.designation} onChange={change} required disabled={!form.department}>
            <option value="">{form.department ? (designations.length ? "Select designation" : "No active designation available") : "Select department first"}</option>
            {designations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>State *</span>
          <ReusableSearchSelect
            value={selectedState}
            options={INDIAN_STATE_OPTIONS}
            onChange={option => {
              const state = option?.value || "";
              const nextCities = getCityOptions(state);
              setForm(current => ({ ...current, state, city: "" }));
              setManualCity(Boolean(state) && nextCities.length === 0);
            }}
            isClearable
            isSearchable
            placeholder="Search and select state"
            noOptionsMessage={() => "No state found"}
            aria-label="State"
          />
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>City *</span>
          {manualCity || (form.state && cityOptions.length === 0) ? (
            <div className="space-y-1.5">
              <input name="city" value={form.city} onChange={change} className={formControlClass} placeholder="Enter city name" required />
              {cityOptions.length > 0 && <button type="button" onClick={() => { setManualCity(false); setForm(current => ({ ...current, city: "" })); }} className="text-[10px] font-bold text-blue-600">Choose from city list</button>}
            </div>
          ) : (
            <div className="space-y-1.5">
              <ReusableSearchSelect
                value={selectedCity}
                options={cityOptions}
                onChange={option => setForm(current => ({ ...current, city: option?.value || "" }))}
                isDisabled={!form.state}
                isClearable
                isSearchable
                placeholder={form.state ? "Search and select city" : "Select state first"}
                noOptionsMessage={() => form.state ? "City not found" : "Select state first"}
                aria-label="City"
              />
              {form.state && <button type="button" onClick={() => { setManualCity(true); setForm(current => ({ ...current, city: "" })); }} className="text-[10px] font-bold text-blue-600">City not listed? Enter manually</button>}
            </div>
          )}
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Reporting Manager</span>
          <ReusableSelect name="reporting_manager" value={form.reporting_manager} onChange={change}><option value="">No reporting manager</option>{(options.reportingManagers || options.employees || []).map((item) => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Relationship Manager</span>
          <ReusableSelect name="relationship_manager" value={form.relationship_manager} onChange={change}><option value="">No relationship manager</option>{(options.relationshipManagers || options.employees || []).map((item) => <option key={item.id} value={item.id}>{item.employee_code} · {item.name}</option>)}</ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Gender</span>
          <ReusableSelect name="gender" value={form.gender} onChange={change}><option value="">Select gender</option><option>Male</option><option>Female</option><option>Other</option></ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Access Role *</span>
          <ReusableSelect name="user_type" value={form.user_type} onChange={change}><option>Employee</option><option>Manager</option></ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Portal Status *</span>
          <ReusableSelect name="status" value={form.status} onChange={change}><option>Active</option><option>Inactive</option></ReusableSelect>
        </label>
        <label className={`${formLabelClass} sm:col-span-2 xl:col-span-4`}><span className={formLabelTextClass}>Current Address</span>
          <textarea name="current_address" value={form.current_address} onChange={change} rows={3} className={`${formControlClass} h-auto py-3`}/>
        </label>
        <div className="flex items-end"><button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>{submitting ? "Creating…" : "Create Employee"}</button></div>
        {message.text && <p className={`sm:col-span-full text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
      </ReusableForm>}
      <ReusableTable title="Employee Directory" rows={rows} columns={columns} pageSize={20} pageSizeOptions={[20, 50, 100]} emptyMessage="No employees found."/>
    </div>
  );
}
