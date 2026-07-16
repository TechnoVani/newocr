import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast, { Toaster } from "react-hot-toast";
import ReactSelect from "react-select";
import { AlertCircle } from "lucide-react";
import axiosInstance from "../config/axios";
import { fetchBqp } from "../redux/actions/bqpActions";
import { fetchReportingManagers } from "../redux/actions/reportingActions";
import { fetchRelationshipManagers } from "../redux/actions/relationshipActions";
import { fetchPospByRelationshipManager } from "../redux/actions/posActions";

// Dropdown configuration for reference creation flow
const DROPDOWN_STEPS = [
  { name: "bqp", label: "BQP", placeholder: "Select BQP" },
  { name: "manager", label: "Reporting Manager", placeholder: "Select Manager" },
  { name: "relationship", label: "Relationship", placeholder: "Select Relationship" },
  { name: "posp", label: "POSP (Point of Sale)", placeholder: "Select POSP" },
];

// Custom styling helper for ReactSelect
const getCustomStyles = (hasError) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "rgba(248, 250, 252, 0.3)",
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#1E88E5" : "#e2e8f0",
    borderRadius: "0.75rem",
    minHeight: "44px",
    boxShadow: state.isFocused
      ? hasError
        ? "0 0 0 2px rgba(239, 68, 68, 0.2)"
        : "0 0 0 2px rgba(30, 136, 229, 0.2)"
      : "none",
    "&:hover": {
      borderColor: hasError ? "#ef4444" : state.isFocused ? "#1E88E5" : "#cbd5e1",
      backgroundColor: "rgba(248, 250, 252, 0.8)",
    },
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#334155",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "0.85rem",
    fontWeight: "600",
    backgroundColor: state.isSelected
      ? "#1E88E5"
      : state.isFocused
      ? "rgba(30, 136, 229, 0.08)"
      : "white",
    color: state.isSelected ? "white" : "#334155",
    cursor: "pointer",
    "&:active": { backgroundColor: "#1565C0" },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: "600",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#334155",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.75rem",
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
});

export default function AddReference() {
  const dispatch = useDispatch();

  // Redux Selectors
  const { data: bqpList, loading: bqpLoading } = useSelector((state) => state.bqp);
  const { byBqpId, loading: reportingLoading } = useSelector((state) => state.reporting);
  const { byManagerId, loading: relationshipLoading } = useSelector((state) => state.relationship);
  const { byRelationshipId, loading: posLoading } = useSelector((state) => state.pos);

  // References list fetched from backend
  const [referencesList, setReferencesList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedPospFilter, setSelectedPospFilter] = useState("");

  // Extract unique POSPs from references list
  const uniquePosps = Array.from(
    new Map(
      referencesList
        .filter((ref) => ref.pos_id && ref.posp)
        .map((ref) => [ref.pos_id, { id: ref.pos_id, label: ref.posp }])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label));

  // Keep the table empty until a POSP is selected.
  const filteredReferences = selectedPospFilter
    ? referencesList.filter((ref) => String(ref.pos_id) === String(selectedPospFilter))
    : [];

  const [formData, setFormData] = useState({
    bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "",
  });

  const [errors, setErrors] = useState({
    bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "",
  });

  const loadReferences = useCallback(async (showError = true) => {
    try {
      const response = await axiosInstance.get("/references");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setReferencesList(response.data.data);
        return response.data.data;
      }
      throw new Error(response.data?.message || "Invalid references response");
    } catch (err) {
      console.error("Failed to load references:", err);
      if (showError) {
        toast.error(err.response?.data?.message || "Failed to load references list");
      }
      return [];
    }
  }, []);

  // Fetch references on mount
  useEffect(() => {
    // Fetching remote data on mount intentionally updates this component's state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReferences();
  }, [loadReferences]);

  // Load initial BQP data on mount
  useEffect(() => {
    if (!bqpList.length && !bqpLoading) {
      dispatch(fetchBqp());
    }
  }, [dispatch, bqpList.length, bqpLoading]);

  const formatOptionLabel = (option) => {
    if (!option) return "";
    const code = option.employee_code || option.pos_code || "";
    return code ? `${option.name} (${code})` : option.name;
  };

  const handleDropdownChange = async (fieldName, val) => {
    const updatedForm = { ...formData, [fieldName]: val || "" };
    const currentStepIndex = DROPDOWN_STEPS.findIndex((step) => step.name === fieldName);

    // Clear subsequent fields and errors
    const updatedErrors = { ...errors, [fieldName]: "" };
    for (let i = currentStepIndex + 1; i < DROPDOWN_STEPS.length; i++) {
      updatedForm[DROPDOWN_STEPS[i].name] = "";
      updatedErrors[DROPDOWN_STEPS[i].name] = "";
    }
    setFormData(updatedForm);
    setErrors(updatedErrors);

    if (!val) return;

    if (fieldName === "bqp") dispatch(fetchReportingManagers(val));
    else if (fieldName === "manager") dispatch(fetchRelationshipManagers(val));
    else if (fieldName === "relationship") dispatch(fetchPospByRelationshipManager(val));
  };

  const allOptions = {
    bqp: bqpList,
    manager: byBqpId[formData.bqp] || [],
    relationship: byManagerId[formData.manager] || [],
    posp: byRelationshipId[formData.relationship] || [],
  };

  const allLoading = {
    bqp: bqpLoading, manager: reportingLoading, relationship: relationshipLoading, posp: posLoading,
  };

  const isStepDisabled = (index) => {
    if (index === 0) return false;
    return !formData[DROPDOWN_STEPS[index - 1].name];
  };

  const handleSelectChange = (fieldName, selectedOption) => {
    handleDropdownChange(fieldName, selectedOption ? selectedOption.value : "");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleReset = () => {
    setFormData({ bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "" });
    setErrors({ bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "" });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormData({
      bqp: item.bqp_id ? String(item.bqp_id) : "",
      manager: item.reporting_id ? String(item.reporting_id) : "",
      relationship: item.relationship_id ? String(item.relationship_id) : "",
      posp: item.pos_id ? String(item.pos_id) : "",
      name: item.name || "",
      mobile: item.mobile || "",
    });
    setErrors({ bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "" });

    if (item.bqp_id) dispatch(fetchReportingManagers(item.bqp_id));
    if (item.reporting_id) dispatch(fetchRelationshipManagers(item.reporting_id));
    if (item.relationship_id) dispatch(fetchPospByRelationshipManager(item.relationship_id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    let isValid = true;

    DROPDOWN_STEPS.forEach((step) => {
      if (!formData[step.name]) {
        newErrors[step.name] = `${step.label} selection is required.`;
        isValid = false;
      } else newErrors[step.name] = "";
    });

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
      isValid = false;
    } else newErrors.name = "";

    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number.";
      isValid = false;
    } else newErrors.mobile = "";

    setErrors(newErrors);

    if (!isValid) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const payload = {
      bqp_id: formData.bqp,
      reporting_id: formData.manager,
      relationship_id: formData.relationship,
      pos_id: formData.posp,
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
    };

    const saveReference = async () => {
      try {
        const isEdit = !!editingId;
        const toastId = "reference-save";
        toast.loading(isEdit ? "Updating reference..." : "Creating reference...", { id: toastId });
        
        const response = isEdit 
          ? await axiosInstance.put(`/references/${editingId}`, payload)
          : await axiosInstance.post("/references", payload);

        if (response.data?.success) {
          toast.success(isEdit ? "Reference updated successfully!" : "Reference created successfully!", { id: toastId });
          const savedPospId = String(formData.posp);
          await loadReferences();
          setSelectedPospFilter(savedPospId);
          handleReset();
        } else {
          throw new Error(response.data?.message || `Failed to ${isEdit ? 'update' : 'create'} reference`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || `Failed to save reference`, { id: "reference-save" });
      }
    };

    saveReference();
  };

  return (
    <main className="add-reference-dashboard mx-auto flex w-full flex-1 flex-col px-3 py-4 sm:px-6 sm:py-8">
      <style>{`
        .add-reference-dashboard { font-family: Arial, sans-serif; }
        .add-reference-dashboard button, .add-reference-dashboard select, .add-reference-dashboard input,
        .add-reference-dashboard th { font-family: Arial, sans-serif; }
        /* Sticky Table Header */
        .add-reference-dashboard thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8fafc;
        }
        .add-reference-dashboard thead {
          z-index: 10;
        }
        .table-wrapper {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Main Single Card Wrapper */}
      <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        
        {/* Header */}
        <header className="flex flex-col items-start justify-between gap-2 bg-[#1E88E5] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:px-5 sm:py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider sm:text-sm">
            <span>📝</span> {editingId ? "Edit Reference" : "Add New Reference"}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:bg-white/20 sm:w-auto sm:px-3.5"
          >
            <span>🔄</span> Clear Fields
          </button>
        </header>

        {/* Top Form Area (Doesn't scroll) */}
        <form onSubmit={handleSubmit} className="shrink-0 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6">
            {DROPDOWN_STEPS.map((step, idx) => {
              const disabled = isStepDisabled(idx);
              const hasError = !!errors[step.name];
              const stepOptions = Array.isArray(allOptions[step.name]) ? allOptions[step.name] : [];
              const selectedValue = formData[step.name];
              const selectedOption = selectedValue
                ? {
                    value: selectedValue,
                    label: (() => {
                      const found = stepOptions.find((o) => o.id.toString() === selectedValue);
                      return found ? formatOptionLabel(found) : selectedValue;
                    })(),
                  }
                : null;

              return (
                <div key={step.name} className="flex flex-col">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2">
                    {step.label}
                  </label>
                  <ReactSelect
                    name={step.name}
                    value={selectedOption}
                    onChange={(selected) => handleSelectChange(step.name, selected)}
                    options={stepOptions.map((opt) => ({
                      value: opt.id.toString(),
                      label: formatOptionLabel(opt),
                    }))}
                    isDisabled={disabled}
                    isLoading={allLoading[step.name]}
                    isSearchable={true}
                    placeholder={step.placeholder}
                    noOptionsMessage={() => "No Data Available"}
                    styles={getCustomStyles(hasError)}
                    menuPortalTarget={document.body}
                    classNamePrefix="react-select"
                  />
                  {hasError && (
                    <div className="mt-1 flex items-center gap-1 text-red-500">
                      <AlertCircle size={10} className="shrink-0" />
                      <span className="text-[9px] font-bold">{errors[step.name]}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Reference Name */}
            <div className="flex flex-col">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2">
                Reference Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter Name"
                value={formData.name}
                onChange={handleInputChange}
                className={`h-[44px] w-full rounded-xl border px-4 text-xs font-semibold text-slate-700 outline-none transition ${
                  errors.name
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {errors.name && (
                <div className="mt-1 flex items-center gap-1 text-red-500">
                  <AlertCircle size={10} className="shrink-0" />
                  <span className="text-[9px] font-bold">{errors.name}</span>
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div className="flex flex-col">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:mb-2">
                Mobile Number
              </label>
              <input
                type="text"
                name="mobile"
                placeholder="Enter Mobile Number"
                value={formData.mobile}
                onChange={handleInputChange}
                className={`h-[44px] w-full rounded-xl border px-4 text-xs font-semibold text-slate-700 outline-none transition ${
                  errors.mobile
                    ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              {errors.mobile && (
                <div className="mt-1 flex items-center gap-1 text-red-500">
                  <AlertCircle size={10} className="shrink-0" />
                  <span className="text-[9px] font-bold">{errors.mobile}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="submit"
              className="w-full rounded-xl bg-[#1E88E5] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-200 hover:bg-[#1565C0] sm:w-auto"
            >
              {editingId ? "Update Reference" : "Create Reference"}
            </button>
          </div>
        </form>

        {/* Divider / List Filter Area */}
        <div className="flex shrink-0 flex-col items-start gap-3 border-y border-slate-100 bg-slate-50/50 px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.01)] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <span>📋</span> REFERENCES LIST
          </div>
          <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filter by POSP:</span>
            <select
              value={selectedPospFilter}
              onChange={(e) => setSelectedPospFilter(e.target.value)}
              className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 sm:w-auto sm:min-w-[200px]"
            >
              <option value="">Select POSP to view...</option>
              {uniquePosps.map((posp) => (
                <option key={posp.id} value={posp.id}>
                  {posp.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="table-wrapper flex-1 bg-slate-50/30">
          <table className="w-full min-w-[1000px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-[80px] whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Sr. No.</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">BQP</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Reporting Manager</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Relationship</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">POSP</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Reference Name</th>
                <th className="whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Mobile Number</th>
                <th className="w-[100px] whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 shadow-[0_1px_0_#e2e8f0] sm:px-5 sm:py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredReferences.length > 0 ? (
                filteredReferences.map((ref, idx) => (
                  <tr key={ref.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-xs font-semibold text-slate-600 sm:px-5 sm:py-3">{idx + 1}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 sm:px-5 sm:py-3">{ref.bqp}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-600 sm:px-5 sm:py-3">{ref.manager}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-600 sm:px-5 sm:py-3">{ref.relationship}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-600 sm:px-5 sm:py-3">{ref.posp}</td>
                    <td className="px-3 py-2 text-xs font-bold text-blue-600 sm:px-5 sm:py-3">{ref.name}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 sm:px-5 sm:py-3">{ref.mobile}</td>
                    <td className="px-3 py-2 text-xs font-semibold text-slate-700 sm:px-5 sm:py-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(ref)}
                        className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 transition-colors hover:bg-blue-100"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="bg-slate-50/5 py-10 text-center text-xs font-semibold italic text-slate-400">
                    {selectedPospFilter
                      ? "No references found matching the selected POSP."
                      : "Please select a POSP from the filter dropdown above to view references."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
