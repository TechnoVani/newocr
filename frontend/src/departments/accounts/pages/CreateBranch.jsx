import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { GitBranch, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../../components/reusable/ReusableForm";
import ReusableSelect from "../../../components/reusable/ReusableSelect";
import ReusableSearchSelect from "../../../components/reusable/ReusableSearchSelect";
import { getCityOptions, INDIAN_STATE_OPTIONS } from "../../../config/indiaLocations";

const EMPTY = { insurer_type: "", insurer: "", status: "Active", brockercode: "", gst_no: "", address: "", state: "", city: "", pin_code: "", contact: "", support_email: "", name: "", designation: "", mobile: "", email: "" };
const fields = [
  ["brockercode", "Broker Code"], ["gst_no", "GST Number"], ["address", "Branch Address"], ["pin_code", "Pin Code"], ["contact", "Branch Contact"], ["support_email", "Support Email", "email"], ["name", "Contact Person"], ["designation", "Designation"], ["mobile", "Mobile"], ["email", "Personal Email", "email"],
];
export default function CreateBranch({ branches = [], companies = [], onAddBranch, onUpdateBranch, onChangeStatus }) {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [typeFilter, setTypeFilter] = useState("All");
  const [insurerFilter, setInsurerFilter] = useState("All");
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);
  const insurerOptions = useMemo(() => companies
    .filter((item) => String(item.type || "").toLowerCase() === form.insurer_type.toLowerCase())
    .filter((item) => item.status !== "Inactive" || form.status === "Inactive" || item.insurer === form.insurer)
    .map((item) => ({ value: item.insurer, label: item.insurer }))
    .sort((first, second) => first.label.localeCompare(second.label)), [companies, form.insurer, form.insurer_type, form.status]);
  const cityOptions = useMemo(() => getCityOptions(form.state), [form.state]);
  const selectedInsurer = insurerOptions.find((option) => option.value === form.insurer) || null;
  const selectedState = INDIAN_STATE_OPTIONS.find((option) => option.value === form.state) || null;
  const selectedCity = cityOptions.find((option) => option.value === form.city) || null;
  const companyTypeByInsurer = useMemo(() => new Map(companies.map((company) => [String(company.insurer || "").trim().toLowerCase(), company.type || "—"])), [companies]);
  const branchesWithType = useMemo(() => branches.map((branch) => ({
    ...branch,
    insurer_type: branch.insurer_type || companyTypeByInsurer.get(String(branch.insurer || "").trim().toLowerCase()) || "—",
  })), [branches, companyTypeByInsurer]);
  const branchInsurerOptions = useMemo(() => ["All", ...new Set(branchesWithType
    .filter((branch) => typeFilter === "All" || branch.insurer_type === typeFilter)
    .map((branch) => branch.insurer)
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second)))], [branchesWithType, typeFilter]);
  const visibleBranches = useMemo(() => branchesWithType.filter((branch) =>
    (typeFilter === "All" || branch.insurer_type === typeFilter)
    && (insurerFilter === "All" || branch.insurer === insurerFilter)
  ), [branchesWithType, insurerFilter, typeFilter]);
  const reset = () => { setForm(EMPTY); setEditingId(null); setMessage({ type: "", text: "" }); };
  const editBranch = (branch) => {
    setEditingId(branch.id);
    setForm(Object.fromEntries(Object.keys(EMPTY).map((key) => [key, key === "insurer_type" ? branch.insurer_type || companyTypeByInsurer.get(String(branch.insurer || "").trim().toLowerCase()) || "" : branch[key] || ""])));
    setMessage({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.insurer_type) return setMessage({ type: "error", text: "Select an insurer type." });
    if (!form.insurer) return setMessage({ type: "error", text: "Select an insurance company." });
    setSubmitting(true);
    try {
      if (editingId) await onUpdateBranch(editingId, form);
      else await onAddBranch(form);
      setMessage({ type: "success", text: `Insurance branch ${editingId ? "updated" : "created"} successfully.` });
      setForm(EMPTY);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || error.message || `Unable to ${editingId ? "update" : "create"} branch.` });
    } finally {
      setSubmitting(false);
    }
  };
  const changeStatus = async (branch) => {
    const status = branch.status === "Inactive" ? "Active" : "Inactive";
    setActionId(branch.id);
    setMessage({ type: "", text: "" });
    try {
      await onChangeStatus(branch.id, status);
      setMessage({ type: "success", text: `Branch is now ${status}.` });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || error.message || "Unable to change branch status." });
    } finally {
      setActionId(null);
    }
  };
  const columns = [
    { key: "insurer_type", label: "Insurer Type" }, { key: "insurer", label: "Insurer" }, { key: "brockercode", label: "Broker Code" }, { key: "gst_no", label: "GST Number" },
    { key: "city", label: "City / State", render: (value, row) => [value, row.state].filter(Boolean).join(", ") || "—" }, { key: "contact", label: "Branch Contact" }, { key: "name", label: "Contact Person" }, { key: "mobile", label: "Mobile" },
    { key: "status", label: "Status", render: (value) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${value === "Inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{value || "Active"}</span> },
    { key: "action", label: "Action", render: (_, row) => <div className="flex items-center gap-1">
      <button type="button" disabled={actionId === row.id} onClick={() => editBranch(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50" title="Edit branch"><Pencil size={15} aria-hidden="true" /></button>
      <button type="button" disabled={actionId === row.id} onClick={() => changeStatus(row)} className={`rounded-lg p-2 hover:bg-slate-50 disabled:opacity-50 ${row.status === "Inactive" ? "text-slate-400 hover:text-emerald-600" : "text-emerald-600 hover:text-amber-600"}`} title={row.status === "Inactive" ? "Activate branch" : "Deactivate branch"}>{row.status === "Inactive" ? <ToggleLeft size={18} aria-hidden="true" /> : <ToggleRight size={18} aria-hidden="true" />}</button>
    </div> },
  ];
  const exportBranches = (rows = visibleBranches) => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows.map((branch) => ({
      "Insurer Type": branch.insurer_type || "",
      Insurer: branch.insurer || "",
      "Broker Code": branch.brockercode || "",
      "GST Number": branch.gst_no || "",
      "Branch Address": branch.address || "",
      State: branch.state || "",
      City: branch.city || "",
      "Pin Code": branch.pin_code || "",
      "Branch Contact": branch.contact || "",
      "Support Email": branch.support_email || "",
      "Contact Person": branch.name || "",
      Designation: branch.designation || "",
      Mobile: branch.mobile || "",
      "Personal Email": branch.email || "",
      Status: branch.status || "Active",
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Insurer Branches");
    XLSX.writeFile(workbook, `Insurer_Branches_${typeFilter}_${insurerFilter}.xlsx`);
  };
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <ReusableForm title={editingId ? "Update Insurer Branch" : "Create Insurer Branch"} icon={GitBranch} onSubmit={submit} onReset={reset} submitLabel={editingId ? "Update Branch" : "Save Branch"} gridClassName="sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" message={message.text} messageType={message.type} submitting={submitting}>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Insurer Type *</span>
          <ReusableSelect
            value={form.insurer_type}
            onChange={(event) => setForm((current) => ({ ...current, insurer_type: event.target.value, insurer: "" }))}
            className={`cursor-pointer border-blue-100 bg-blue-50/30 hover:border-blue-300 ${form.insurer_type ? "text-slate-700" : "text-slate-400"}`}
            required
          >
            <option value="" disabled>Select Insurer Type</option>
            <option value="Life">Life</option>
            <option value="General">General</option>
            <option value="Health">Health</option>
          </ReusableSelect>
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Insurer Company *</span>
          <ReusableSearchSelect
            value={selectedInsurer}
            options={insurerOptions}
            onChange={(option) => setForm((current) => ({ ...current, insurer: option?.value || "" }))}
            isDisabled={!form.insurer_type}
            isSearchable
            placeholder={form.insurer_type ? "Search and select insurer" : "Select insurer type first"}
            noOptionsMessage={() => form.insurer_type ? `No ${form.insurer_type} insurers found` : "Select insurer type first"}
            aria-label="Insurer Company"
          />
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>State</span>
          <ReusableSearchSelect
            value={selectedState}
            options={INDIAN_STATE_OPTIONS}
            onChange={(option) => setForm((current) => ({ ...current, state: option?.value || "", city: "" }))}
            isClearable
            isSearchable
            placeholder="Search and select state"
            noOptionsMessage={() => "No state found"}
            aria-label="State"
          />
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>City</span>
          <ReusableSearchSelect
            value={selectedCity}
            options={cityOptions}
            onChange={(option) => setForm((current) => ({ ...current, city: option?.value || "" }))}
            isDisabled={!form.state}
            isClearable
            isSearchable
            placeholder={form.state ? "Search and select city" : "Select state first"}
            noOptionsMessage={() => form.state ? "No city found" : "Select state first"}
            aria-label="City"
          />
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Status *</span>
          <ReusableSelect value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} required aria-label="Branch Status">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </ReusableSelect>
        </label>
        {fields.map(([name, label, type]) => <label key={name} className={`${formLabelClass} ${name === "address" ? "lg:col-span-2" : ""}`}><span className={formLabelTextClass}>{label}</span><input type={type || "text"} value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className={formControlClass} placeholder={`Enter ${label.toLowerCase()}`}/></label>)}
      </ReusableForm>
      <div className="mt-5">
        <ReusableTable
          title="Registered Insurer Branches"
          rows={visibleBranches}
          columns={columns}
          pageSize={10}
          filters={[
            { name: "type", label: "Insurer Type", value: typeFilter, options: ["All", "General", "Life", "Health"], onChange: (event) => { setTypeFilter(event.target.value); setInsurerFilter("All"); } },
            { name: "insurer", label: "Insurer Name", value: insurerFilter, options: branchInsurerOptions, onChange: (event) => setInsurerFilter(event.target.value) },
          ]}
          onResetFilters={() => { setTypeFilter("All"); setInsurerFilter("All"); }}
          onExport={exportBranches}
          exportLabel="Export Branches"
        />
      </div>
    </main>
  );
}
