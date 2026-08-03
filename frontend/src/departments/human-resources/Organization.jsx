import { useEffect, useMemo, useState } from "react";
import { Building2, GitBranch, Save } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../components/reusable/ReusableForm";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import ReusableTable from "../../components/reusable/ReusableTable";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole } from "../../config/roleAccess";
import { hrApi } from "./hrApi";

export default function Organization({ options, refresh }) {
  const { user } = useAuth();
  const canManage = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const [organization, setOrganization] = useState({ departments: [], designations: [] });
  const [departmentName, setDepartmentName] = useState("");
  const [designation, setDesignation] = useState({ name: "", department_id: "", parent_designation_id: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const load = () => hrApi.organization().then(setOrganization).catch((error) => {
    setMessage({ type: "error", text: error.response?.data?.message || "Unable to load organization data." });
  });
  useEffect(() => { load(); }, []);
  const parents = useMemo(() => organization.designations.filter(item =>
    String(item.department_id) === String(designation.department_id)), [organization.designations, designation.department_id]);
  const submitDepartment = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createDepartment({ name: departmentName });
      setDepartmentName(""); setMessage({ type: "success", text: "Department created successfully." }); await load(); refresh();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to create department." });
    }
  };
  const submitDesignation = async event => {
    event.preventDefault(); setMessage({ type: "", text: "" });
    try {
      await hrApi.createDesignation(designation);
      setDesignation({ name: "", department_id: "", parent_designation_id: "" });
      setMessage({ type: "success", text: "Designation hierarchy updated." }); await load(); refresh();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Unable to create designation." });
    }
  };
  return <div className="space-y-5">
    {canManage && <div className="grid gap-5 lg:grid-cols-2">
      <ReusableForm title="Create Department" icon={Building2} onSubmit={submitDepartment} showActions={false}>
        <label className={formLabelClass}><span className={formLabelTextClass}>Department Name *</span>
          <input value={departmentName} onChange={event => setDepartmentName(event.target.value)} className={formControlClass} required/>
        </label>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Create Department</button>
      </ReusableForm>
      <ReusableForm title="Create Designation Hierarchy" icon={GitBranch} onSubmit={submitDesignation} showActions={false} gridClassName="sm:grid-cols-2">
        <label className={formLabelClass}><span className={formLabelTextClass}>Department *</span>
          <ReusableSelect value={designation.department_id} onChange={event => setDesignation({ name: designation.name, department_id: event.target.value, parent_designation_id: "" })} required>
            <option value="">Select department</option>{(options.departments || []).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </ReusableSelect>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Designation Name *</span>
          <input value={designation.name} onChange={event => setDesignation(current => ({ ...current, name: event.target.value }))} className={formControlClass} required/>
        </label>
        <label className={formLabelClass}><span className={formLabelTextClass}>Reports To Designation</span>
          <ReusableSelect value={designation.parent_designation_id} onChange={event => setDesignation(current => ({ ...current, parent_designation_id: event.target.value }))}>
            <option value="">Top-level designation</option>{parents.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </ReusableSelect>
        </label>
        <button className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-bold uppercase text-white"><Save size={15}/>Create Designation</button>
      </ReusableForm>
    </div>}
    {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
    <ReusableTable title="Department Directory" rows={organization.departments} columns={[
      { key: "name", label: "Department" }, { key: "employee_count", label: "Employees" },
    ]}/>
    <ReusableTable title="Designation Hierarchy" rows={organization.designations} columns={[
      { key: "department", label: "Department" }, { key: "name", label: "Designation" },
      { key: "parent_designation", label: "Reports To" }, { key: "hierarchy_level", label: "Hierarchy Level" },
      { key: "employee_count", label: "Employees" }, { key: "status", label: "Status" },
    ]} pageSize={20} pageSizeOptions={[20, 50, 100]}/>
  </div>;
}
