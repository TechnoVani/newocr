import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Building2, Pencil, Save, ToggleLeft, ToggleRight } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "../../../components/reusable/ReusableForm";
import ReusableSelect from "../../../components/reusable/ReusableSelect";

const EMPTY = { insurer: "", link: "", type: "", status: "Active" };
export default function CreateCompany({ companies = [], onAddCompany, onUpdateCompany, onChangeStatus }) {
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("All");
  const visibleCompanies = useMemo(() => companies.filter((company) => typeFilter === "All" || company.type === typeFilter), [companies, typeFilter]);
  const reset = () => { setForm(EMPTY); setEditingId(null); setMessage({ type: "", text: "" }); };
  const editCompany = (company) => {
    setEditingId(company.id);
    setForm({
      insurer: company.insurer || "",
      link: company.link || "",
      type: ["General", "Life", "Health"].includes(company.type) ? company.type : "",
      status: company.status || "Active",
    });
    setMessage({ type: "", text: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!form.insurer.trim()) return setMessage({ type: "error", text: "Insurer name is required." });
    if (!form.type) return setMessage({ type: "error", text: "Select an insurer type." });
    if (companies.some((item) => String(item.id) !== String(editingId) && String(item.insurer || "").toLowerCase() === form.insurer.trim().toLowerCase())) return setMessage({ type: "error", text: "This insurer is already registered." });
    setSubmitting(true);
    try {
      const payload = { ...form, insurer: form.insurer.trim(), link: form.link.trim() };
      if (editingId) await onUpdateCompany(editingId, payload);
      else await onAddCompany(payload);
      setMessage({ type: "success", text: editingId ? "Insurer company updated successfully." : "Insurer company created successfully." });
      setForm(EMPTY);
      setEditingId(null);
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || `Unable to ${editingId ? "update" : "create"} insurer company.` });
    } finally {
      setSubmitting(false);
    }
  };
  const changeStatus = async (company) => {
    const status = company.status === "Inactive" ? "Active" : "Inactive";
    setActionId(company.id);
    setMessage({ type: "", text: "" });
    try {
      await onChangeStatus(company.id, status);
      setMessage({ type: "success", text: `${company.insurer} is now ${status}.` });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || error.message || "Unable to change insurer status." });
    } finally {
      setActionId(null);
    }
  };
  const columns = [
    { key: "insurer", label: "Insurer / Company" },
    { key: "link", label: "Portal Link", render: (value) => value ? <a href={value} target="_blank" rel="noreferrer" className="font-bold text-blue-600 hover:underline">{value}</a> : "—" },
    { key: "type", label: "Insurer Type" },
    { key: "status", label: "Status", render: (value) => <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${value === "Inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{value || "Active"}</span> },
    { key: "action", label: "Action", render: (_, row) => <div className="flex items-center gap-1">
      <button type="button" disabled={actionId === row.id} onClick={() => editCompany(row)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50" title="Edit insurer company"><Pencil size={15} aria-hidden="true" /></button>
      <button type="button" disabled={actionId === row.id} onClick={() => changeStatus(row)} className={`rounded-lg p-2 hover:bg-slate-50 disabled:opacity-50 ${row.status === "Inactive" ? "text-slate-400 hover:text-emerald-600" : "text-emerald-600 hover:text-amber-600"}`} title={row.status === "Inactive" ? "Activate insurer" : "Deactivate insurer"}>{row.status === "Inactive" ? <ToggleLeft size={18} aria-hidden="true" /> : <ToggleRight size={18} aria-hidden="true" />}</button>
    </div> },
  ];
  const exportCompanies = (rows = visibleCompanies) => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows.map((company) => ({
      "Insurer / Company": company.insurer || "",
      "Portal Link": company.link || "",
      "Insurer Type": company.type || "",
      Status: company.status || "Active",
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Registered Insurers");
    XLSX.writeFile(workbook, `Registered_Insurers_${typeFilter}.xlsx`);
  };
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <ReusableForm title={editingId ? "Update Insurer Company" : "Create Insurer Company"} icon={Building2} onSubmit={submit} onReset={reset} gridClassName="sm:grid-cols-2 xl:grid-cols-5" showActions={false}>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Insurer Company Name *</span>
          <input value={form.insurer} onChange={(event) => setForm((current) => ({ ...current, insurer: event.target.value }))} className={formControlClass} placeholder="Enter insurer company name" required />
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Company Portal Link</span>
          <input type="url" value={form.link} onChange={(event) => setForm((current) => ({ ...current, link: event.target.value }))} className={formControlClass} placeholder="https://company.example" />
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Insurer Type *</span>
          <ReusableSelect
            value={form.type}
            onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            className={`cursor-pointer border-blue-100 bg-blue-50/30 hover:border-blue-300 ${form.type ? "text-slate-700" : "text-slate-400"}`}
            required
            aria-label="Insurer Type"
          >
            <option value="" disabled className="bg-white text-slate-400">Select Insurer Type</option>
            <option value="General" className="bg-white font-semibold text-slate-700">General</option>
            <option value="Life" className="bg-white font-semibold text-slate-700">Life</option>
            <option value="Health" className="bg-white font-semibold text-slate-700">Health</option>
          </ReusableSelect>
        </label>
        <label className={formLabelClass}>
          <span className={formLabelTextClass}>Status *</span>
          <ReusableSelect value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} required aria-label="Company Status">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </ReusableSelect>
        </label>
        <div className={formLabelClass}>
          <span className={formLabelTextClass}>{editingId ? "Update Action" : "Submit Action"}</span>
          <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#121212] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-60">
            <Save size={15} aria-hidden="true" /> {submitting ? "Saving..." : editingId ? "Update Insurer" : "Submit Insurer"}
          </button>
        </div>
        {message.text && <p role={message.type === "error" ? "alert" : "status"} className={`text-xs font-bold sm:col-span-2 xl:col-span-5 ${message.type === "error" ? "text-red-600" : "text-emerald-600"}`}>{message.text}</p>}
      </ReusableForm>
      <div className="mt-5">
        <ReusableTable
          title="Registered Insurers"
          rows={visibleCompanies}
          columns={columns}
          pageSize={10}
          filters={[
            { name: "type", label: "Insurer Type", value: typeFilter, options: ["All", "General", "Life", "Health"], onChange: (event) => setTypeFilter(event.target.value) },
          ]}
          onResetFilters={() => setTypeFilter("All")}
          onExport={exportCompanies}
          exportLabel="Export Insurers"
        />
      </div>
    </main>
  );
}
