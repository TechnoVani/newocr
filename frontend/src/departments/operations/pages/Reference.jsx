import { useState, useEffect, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { AlertCircle, FilePenLine, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../components/reusable/ReusableTable";
import ReusableForm, { formControlClass } from "../../../components/reusable/ReusableForm";
import ReusableSearchSelect from "../../../components/reusable/ReusableSearchSelect";
import { hierarchyApi } from "../services/hierarchyApi";
import { referenceApi } from "../services/referenceApi";

// Dropdown configuration for reference creation flow
const DROPDOWN_STEPS = [
  { name: "bqp", label: "BQP", placeholder: "Select BQP" },
  { name: "manager", label: "Reporting Manager", placeholder: "Select Manager" },
  { name: "relationship", label: "Relationship", placeholder: "Select Relationship" },
  { name: "posp", label: "POSP (Point of Sale)", placeholder: "Select POSP" },
];

export default function AddReference() {
  const hierarchyRequestIds = useRef({});
  const tableRequestId = useRef(0);
  const [allOptions, setAllOptions] = useState({
    bqp: [], manager: [], relationship: [], posp: [],
  });
  const [allLoading, setAllLoading] = useState({
    bqp: false, manager: false, relationship: false, posp: false,
  });

  // References list fetched from backend
  const [referencesList, setReferencesList] = useState([]);
  const [filteredReferences, setFilteredReferences] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
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

  const [formData, setFormData] = useState({
    bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "",
  });

  const [errors, setErrors] = useState({
    bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "",
  });

  const loadReferences = useCallback(async (showError = true) => {
    try {
      const data = await referenceApi.getAll();
      setReferencesList(data);
      setFilteredReferences(data);
      return data;
    } catch (err) {
      console.error("Failed to load references:", err);
      if (showError) {
        toast.error(err.response?.data?.message || "Failed to load references list");
      }
      return [];
    }
  }, []);

  const loadHierarchyOptions = useCallback(async (fieldName, request) => {
    const requestId = (hierarchyRequestIds.current[fieldName] || 0) + 1;
    hierarchyRequestIds.current[fieldName] = requestId;
    setAllLoading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const data = await request();
      if (hierarchyRequestIds.current[fieldName] !== requestId) return [];
      setAllOptions((prev) => ({ ...prev, [fieldName]: data }));
      return data;
    } catch (err) {
      if (hierarchyRequestIds.current[fieldName] !== requestId) return [];
      setAllOptions((prev) => ({ ...prev, [fieldName]: [] }));
      toast.error(err.response?.data?.message || err.message || `Failed to load ${fieldName}`);
      return [];
    } finally {
      if (hierarchyRequestIds.current[fieldName] === requestId) {
        setAllLoading((prev) => ({ ...prev, [fieldName]: false }));
      }
    }
  }, []);

  const loadPospReferences = useCallback(async (pospId) => {
    const requestId = tableRequestId.current + 1;
    tableRequestId.current = requestId;
    if (!pospId) {
      setFilteredReferences(referencesList);
      return referencesList;
    }

    setTableLoading(true);
    try {
      const data = await hierarchyApi.getReferences(pospId);
      if (tableRequestId.current !== requestId) return [];
      setFilteredReferences(data);
      return data;
    } catch (err) {
      if (tableRequestId.current !== requestId) return [];
      setFilteredReferences([]);
      toast.error(err.response?.data?.message || err.message || "Failed to load POSP references");
      return [];
    } finally {
      if (tableRequestId.current === requestId) setTableLoading(false);
    }
  }, [referencesList]);

  // Fetch references on mount
  useEffect(() => {
    // Fetching remote data on mount intentionally updates this component's state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReferences();
  }, [loadReferences]);

  // Read the current BQP list directly from the backend on every page mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHierarchyOptions("bqp", hierarchyApi.getBqp);
  }, [loadHierarchyOptions]);

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

    const dependentFields = DROPDOWN_STEPS
      .slice(currentStepIndex + 1)
      .map((step) => step.name);

    // Invalidate old requests synchronously before starting the next request.
    // Side effects inside a React state updater can run later and incorrectly
    // discard a valid reporting-manager response as stale.
    dependentFields.forEach((dependentField) => {
      hierarchyRequestIds.current[dependentField] =
        (hierarchyRequestIds.current[dependentField] || 0) + 1;
    });

    setAllOptions((prev) => ({
      ...prev,
      ...Object.fromEntries(dependentFields.map((field) => [field, []])),
    }));
    setAllLoading((prev) => ({
      ...prev,
      ...Object.fromEntries(dependentFields.map((field) => [field, false])),
    }));

    if (currentStepIndex < DROPDOWN_STEPS.findIndex((step) => step.name === "posp")) {
      setSelectedPospFilter("");
      setFilteredReferences(referencesList);
    }

    if (!val) return;

    if (fieldName === "bqp") {
      await loadHierarchyOptions("manager", () => hierarchyApi.getReportingManagers(val));
    } else if (fieldName === "manager") {
      await loadHierarchyOptions("relationship", () =>
        hierarchyApi.getRelationshipManagers(val, updatedForm.bqp)
      );
    } else if (fieldName === "relationship") {
      await loadHierarchyOptions("posp", () =>
        hierarchyApi.getPosps(val, updatedForm.bqp, updatedForm.manager)
      );
    } else if (fieldName === "posp") {
      setSelectedPospFilter(val);
      await loadPospReferences(val);
    }
  };

  const isStepDisabled = (index) => {
    if (index === 0) return false;
    return !formData[DROPDOWN_STEPS[index - 1].name];
  };

  const handleSelectChange = (fieldName, selectedOption) => {
    handleDropdownChange(fieldName, selectedOption ? selectedOption.value : "");
  };

  const handlePospFilterChange = async (event) => {
    const pospId = event.target.value;
    setSelectedPospFilter(pospId);
    await loadPospReferences(pospId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      // Allow only numbers and maximum 10 digits
      const mobile = value.replace(/\D/g, "").slice(0, 10);

      setFormData((prev) => ({
        ...prev,
        mobile,
      }));

      setErrors((prev) => ({
        ...prev,
        mobile:
          mobile.length > 0 && mobile.length < 10
            ? "Mobile number must be 10 digits."
            : "",
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleReset = () => {
    ["manager", "relationship", "posp"].forEach((fieldName) => {
      hierarchyRequestIds.current[fieldName] =
        (hierarchyRequestIds.current[fieldName] || 0) + 1;
    });
    setAllOptions((prev) => ({
      ...prev, manager: [], relationship: [], posp: [],
    }));
    setFormData({ bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "" });
    setErrors({ bqp: "", manager: "", relationship: "", posp: "", name: "", mobile: "" });
    setEditingId(null);
  };

  const handleEdit = async (item) => {
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

    await Promise.all([
      item.bqp_id
        ? loadHierarchyOptions("manager", () => hierarchyApi.getReportingManagers(item.bqp_id))
        : Promise.resolve([]),
      item.reporting_id
        ? loadHierarchyOptions("relationship", () =>
            hierarchyApi.getRelationshipManagers(item.reporting_id, item.bqp_id)
          )
        : Promise.resolve([]),
      item.relationship_id
        ? loadHierarchyOptions("posp", () =>
            hierarchyApi.getPosps(item.relationship_id, item.bqp_id, item.reporting_id)
          )
        : Promise.resolve([]),
    ]);
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

    // Mobile Validation
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
      isValid = false;
    } else if (formData.mobile.trim().length < 10) {
      newErrors.mobile = "Mobile number must be 10 digits.";
      isValid = false;
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      newErrors.mobile =
        "Please enter a valid 10-digit Indian mobile number.";
      isValid = false;
    } else {
      newErrors.mobile = "";
    }

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
          ? await referenceApi.update(editingId, payload)
          : await referenceApi.create(payload);

        if (response?.success) {
          toast.success(isEdit ? "Reference updated successfully!" : "Reference created successfully!", { id: toastId });
          const savedPospId = String(formData.posp);
          await loadReferences();
          setSelectedPospFilter(savedPospId);
          await loadPospReferences(savedPospId);
          handleReset();
        } else {
          throw new Error(response?.message || `Failed to ${isEdit ? 'update' : 'create'} reference`);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || err.message || `Failed to save reference`, { id: "reference-save" });
      }
    };

    saveReference();
  };

  const referenceColumns = [
    { key: "bqp", label: "BQP" },
    { key: "manager", label: "Reporting Manager" },
    { key: "relationship", label: "Relationship" },
    { key: "posp", label: "POSP" },
    { key: "name", label: "Reference Name" },
    { key: "mobile", label: "Mobile Number" },
    { key: "action", label: "Action", render: (_, row) => (
      <button type="button" onClick={() => handleEdit(row)} className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 transition hover:bg-blue-100">
        Edit
      </button>
    ) },
  ];

  const exportReferences = () => {
    if (!filteredReferences.length) {
      toast.error("No reference records available to export.");
      return;
    }
    const rows = filteredReferences.map((reference, index) => ({
      "Sr. No.": index + 1,
      BQP: reference.bqp || "N/A",
      "Reporting Manager": reference.manager || "N/A",
      Relationship: reference.relationship || "N/A",
      POSP: reference.posp || "N/A",
      "Reference Name": reference.name || "N/A",
      "Mobile Number": reference.mobile || "N/A",
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = Object.keys(rows[0]).map((heading) => ({ wch: Math.max(16, heading.length + 3) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "References");
    XLSX.writeFile(workbook, `Operations_References_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Reference report downloaded successfully.");
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

      <ReusableForm
        title={editingId ? "Edit Reference" : "Add New Reference"}
        icon={FilePenLine}
        onSubmit={handleSubmit}
        onReset={handleReset}
        submitLabel={editingId ? "Update Reference" : "Create Reference"}
        gridClassName=""
      >
          <div className="grid grid-cols-1 gap-4 sm:col-span-full sm:grid-cols-2 md:grid-cols-6">
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
                  <ReusableSearchSelect
                    hasError={hasError}
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
                className={`${formControlClass} ${
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
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]{10}"
                autoComplete="off"
                className={`${formControlClass} ${
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

      </ReusableForm>
        <div className="mt-5 bg-slate-50/30">
          {tableLoading
            ? <p className="py-12 text-center text-xs font-semibold text-slate-400">Loading references...</p>
            : <ReusableTable
                title="Operations Reference Report"
                icon={FileText}
                rows={filteredReferences}
                columns={referenceColumns}
                pageSize={10}
                filters={[
                  {
                    name: "posp",
                    label: "POSP Type",
                    value: selectedPospFilter,
                    options: [
                      { value: "", label: "All POSP References" },
                      ...uniquePosps.map((posp) => ({ value: posp.id, label: posp.label })),
                    ],
                    onChange: handlePospFilterChange,
                  },
                ]}
                onExport={exportReferences}
                emptyMessage={selectedPospFilter ? "No references found for the selected POSP" : "No references are available"}
              />}
        </div>
    </main>
  );
}
