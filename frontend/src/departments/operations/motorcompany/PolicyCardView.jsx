import { useState, useEffect, useRef } from 'react';
import { Tooltip, CircularProgress } from '@mui/material';
import {
  MapPin,
  FileText,
  ChevronRight,
  Copy,
  Check,
  Save,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { submitPolicyData } from '../../../config/axios';
import ReusableForm from '../../../components/reusable/ReusableForm';
import ReusableSearchSelect from '../../../components/reusable/ReusableSearchSelect';
import { DROPDOWN_STEPS } from './MotorEntrySection';
import {
  readMotorPolicyFormDraft,
  saveMotorPolicyFormDraft,
} from '../services/motorDraftStorage';

// ----- Date Helpers -----
const monthNames = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
};

const toDisplayDateFormat = (dateStr) => {
  if (!dateStr || dateStr === "-") return dateStr;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) return dateStr;
  let ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (ymdMatch) return `${ymdMatch[3]}-${ymdMatch[2]}-${ymdMatch[1]}`;
  let slashMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  let hyphenMatch = dateStr.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (hyphenMatch) {
    const monthNum = monthNames[hyphenMatch[2].toLowerCase()];
    if (monthNum) return `${hyphenMatch[1]}-${monthNum}-${hyphenMatch[3]}`;
  }
  let spaceMatch = dateStr.match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (spaceMatch) {
    const monthNum = monthNames[spaceMatch[2].toLowerCase()];
    if (monthNum) return `${spaceMatch[1]}-${monthNum}-${spaceMatch[3]}`;
  }
  let textMatch = dateStr.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textMatch) {
    const monthNum = monthNames[textMatch[1].substring(0, 3).toLowerCase()];
    const paddedDay = textMatch[2].padStart(2, '0');
    if (monthNum) return `${paddedDay}-${monthNum}-${textMatch[3]}`;
  }
  return dateStr;
};

const toDateInputValue = (dateStr) => {
  if (!dateStr || dateStr === "-") return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  let dashMatch = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMatch) return `${dashMatch[3]}-${dashMatch[2]}-${dashMatch[1]}`;
  let slashMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slashMatch) return `${slashMatch[3]}-${slashMatch[2]}-${slashMatch[1]}`;
  let hyphenMatch = dateStr.match(/^(\d{2})-([A-Za-z]{3})-(\d{4})$/);
  if (hyphenMatch) {
    const monthNum = monthNames[hyphenMatch[2].toLowerCase()];
    if (monthNum) return `${hyphenMatch[3]}-${monthNum}-${hyphenMatch[1]}`;
  }
  let spaceMatch = dateStr.match(/^(\d{2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (spaceMatch) {
    const monthNum = monthNames[spaceMatch[2].toLowerCase()];
    if (monthNum) return `${spaceMatch[3]}-${monthNum}-${spaceMatch[1]}`;
  }
  let textMatch = dateStr.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textMatch) {
    const monthNum = monthNames[textMatch[1].substring(0, 3).toLowerCase()];
    const paddedDay = textMatch[2].padStart(2, '0');
    if (monthNum) return `${textMatch[3]}-${monthNum}-${paddedDay}`;
  }
  return "";
};

const fromDateInputValue = (dateValue) => {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split('-');
  return `${day}-${month}-${year}`;
};

// 🔥 Allow a single decimal point
const cleanNumberInput = (value) => {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

// 🔥 Keep decimals, only remove commas
const getPremiumValue = (value) => {
  if (value === null || value === undefined || value === "" || value === "NA") return "";
  return String(value).replace(/,/g, "");
};

const getPolicyCategory = (policyType, truncated = "") => {
  const combined = `${policyType} ${truncated}`.toLowerCase();
  if (combined.includes("comprehensive")) return "Package Policy";
  if (combined.includes("standalone") || combined.includes("own damage") || combined.includes("stand-alone own damage")) return "Standalone OD Policy";
  if (combined.includes("third party") || combined.includes("liability") || combined.includes("act")) return "Liability Policy";
  if (combined.includes("bundled")) return "Bundled Policy";
  if (combined.includes("package")) return "Package Policy";
  return policyType || "-";
};

const shouldShowPremiumField = (matchedPolicy, field) => {
  switch (matchedPolicy) {
    case "Bundled Policy":
      return ["calculatedOdPremium", "calculatedTpPremium", "totalOdPremium", "totalTpPremium", "netPremium", "gst", "totalPayable"].includes(field);
    case "Package Policy":
      return ["totalOdPremium", "totalTpPremium", "netPremium", "gst", "totalPayable"].includes(field);
    case "Standalone OD Policy":
      return ["totalOdPremium", "netPremium", "gst", "totalPayable"].includes(field);
    case "Liability Policy":
      return ["totalTpPremium", "netPremium", "gst", "totalPayable"].includes(field);
    default:
      return false;
  }
};

// ----- Normalise Fuel Type -----
const normalizeFuelType = (fuel) => {
  if (!fuel) return "";
  const lower = fuel.toLowerCase().trim();
  if (lower.includes("petrol")) return "Petrol";
  if (lower.includes("diesel")) return "Diesel";
  if (lower.includes("cng")) return "CNG";
  if (lower.includes("lpg")) return "LPG";
  if (lower.includes("electric")) return "Electric";
  if (lower.includes("hybrid")) return "Hybrid";
  return fuel;
};

const extractNcb = (text = "") => {
  const result = { ncb: "-" };
  const ncbMatch = text.match(/No\s+Claim\s+Bonus\s*[:]?\s*[-]?\s*(\d+%)/i);
  if (ncbMatch) {
    result.ncb = ncbMatch[1];
  }
  return result.ncb;
};

// ----- Reusable UI Components -----
const SectionHeader = ({ icon, title, color }) => {
  const gradients = {
    blue: "from-blue-600 to-indigo-600 shadow-blue-100",
    green: "from-emerald-600 to-teal-600 shadow-emerald-100",
    red: "from-rose-600 to-red-600 shadow-rose-100",
    purple: "from-purple-600 to-violet-600 shadow-purple-100",
    orange: "from-amber-500 to-orange-600 shadow-orange-100",
    teal: "from-teal-500 to-cyan-600 shadow-teal-100"
  };
  return (
    <div className={`bg-gradient-to-r ${gradients[color] || "from-slate-600 to-slate-700"} text-white px-4 py-2.5 rounded-xl flex items-center gap-2 mb-4 shadow-sm`}>
      <span className="text-sm flex items-center">{icon}</span>
      <h4 className="text-[11px] font-bold tracking-wider uppercase">{title}</h4>
    </div>
  );
};

const copyText = async (text, setCopied) => {
  try {
    await navigator.clipboard.writeText(text || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) { console.error(err); }
};

const YearPicker = ({ value, onChange, onClose }) => {
  const currentYear = new Date().getFullYear();
  const [displayYear, setDisplayYear] = useState(value ? parseInt(value) : currentYear);
  const startYear = Math.floor(displayYear / 12) * 12 - 2;
  const years = Array.from({ length: 12 }, (_, i) => startYear + i);

  const handleYearClick = (year) => {
    onChange(String(year));
    onClose();
  };

  return (
    <div className="absolute z-50 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-64 max-w-[calc(100vw-2rem)] sm:w-72 md:w-80" style={{ top: '100%', left: 0 }}>
      <div className="flex justify-between items-center mb-2">
        <button type="button" onClick={() => setDisplayYear(displayYear - 12)} className="text-slate-500 hover:text-slate-800 text-sm px-2 py-1 rounded hover:bg-slate-50 transition-colors">◀</button>
        <span className="text-xs font-semibold text-slate-700">{startYear} – {startYear + 11}</span>
        <button type="button" onClick={() => setDisplayYear(displayYear + 12)} className="text-slate-500 hover:text-slate-800 text-sm px-2 py-1 rounded hover:bg-slate-50 transition-colors">▶</button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {years.map((year) => (
          <button key={year} type="button" onClick={() => handleYearClick(year)} className={`text-xs py-1.5 rounded-lg transition-colors ${String(year) === String(value) ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>
            {year}
          </button>
        ))}
      </div>
    </div>
  );
};

// ----- EditableRow with unified layout -----
const EditableRow = ({ label, value, onChange, type = "text", highlight = false, isDate = false, isTextarea = false, options = [] }) => {
  const dateInputRef = useRef(null);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const yearInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearInputRef.current && !yearInputRef.current.contains(event.target)) {
        setYearPickerOpen(false);
      }
    };
    if (yearPickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [yearPickerOpen]);

  let inputElement;
  const baseInputClass = "text-xs text-slate-800 font-medium bg-slate-50/30 hover:bg-slate-50/80 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 shadow-sm";

  if (isTextarea) {
    inputElement = <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={2} className={`${baseInputClass} resize-none`} />;
  } else if (isDate) {
    const dateValue = toDateInputValue(value);
    const handleClick = () => { if (dateInputRef.current && dateInputRef.current.showPicker) dateInputRef.current.showPicker(); };
    inputElement = <input ref={dateInputRef} type="date" value={dateValue} onChange={(e) => onChange(fromDateInputValue(e.target.value))} onClick={handleClick} className={`date-input-no-button ${baseInputClass} cursor-pointer`} />;
  } else if (type === "year") {
    inputElement = (
      <div className="relative w-full" ref={yearInputRef}>
        <input type="text" readOnly value={value || ""} onClick={() => setYearPickerOpen(!yearPickerOpen)} placeholder="Select Year" className={`${baseInputClass} cursor-pointer`} />
        {yearPickerOpen && <YearPicker value={value} onChange={onChange} onClose={() => setYearPickerOpen(false)} />}
      </div>
    );
  } else if (type === "number") {
    // Allows decimals
    inputElement = (
      <input
        type="text"
        inputMode="decimal"
        pattern="[0-9.]*"
        value={value || ""}
        onChange={(e) => onChange(cleanNumberInput(e.target.value))}
        onKeyPress={(e) => {
          const charCode = e.which ? e.which : e.keyCode;
          if (charCode > 31 && charCode !== 46 && (charCode < 48 || charCode > 57)) {
            e.preventDefault();
          }
        }}
        className={baseInputClass}
      />
    );
  } else if (type === "file") {
    const fileName = value?.name || (typeof value === 'string' ? value : '');
    inputElement = (
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) onChange(file);
          }}
          className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
        />
        {fileName && (
          <span className="text-[10px] text-slate-600 truncate max-w-[100px]" title={fileName}>
            {fileName}
          </span>
        )}
      </div>
    );
  } else if (type === "select") {
    inputElement = (
      <ReusableSearchSelect
        value={options.find((option) => option.value === value) || null}
        onChange={(selected) => onChange(selected?.value || "")}
        options={options}
        isSearchable
        isClearable
        placeholder={`Select ${label}`}
        noOptionsMessage={() => "No Data Available"}
      />
    );
  } else {
    // Plain text input – used for seating and other free‑text fields
    inputElement = <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className={baseInputClass} />;
  }

  const isFullWidthType = type === "file" || isTextarea;
  return (
    <div className={`py-1.5 border-b border-slate-100 last:border-0 ${highlight ? 'bg-blue-50/50 -mx-2 px-2 rounded-lg border border-blue-100/50' : ''}`}>
      <div className={`flex flex-col gap-1 ${!isFullWidthType ? 'sm:flex-row sm:justify-between sm:items-center' : ''}`}>
        <span className={`text-[10px] font-bold text-slate-500 uppercase tracking-wider break-words ${!isFullWidthType ? 'sm:w-1/3 pr-1 sm:pr-2' : 'w-full'}`}>
          {label}
        </span>
        <div className={`min-w-0 ${!isFullWidthType ? 'sm:w-[65%]' : 'w-full'}`}>
          {inputElement}
        </div>
      </div>
    </div>
  );
};

// ----- Main Component -----
function PolicyCardView({
  item,
  policyNumber: initialPolicyNumber,
  insuranceCompany: initialInsuranceCompany,
  branchAddress: initialBranchAddress,
  productType: initialProductType,
  vehicleCategory: initialVehicleCategory,
  insuredName: initialInsuredName,
  panNumber: initialPanNumber,
  gstin: initialGstin,
  contactNumber: initialContactNumber,
  email: initialEmail,
  insuredAddress: initialInsuredAddress,
  policyDates: initialPolicyDates,
  dateOfIssue: initialDateOfIssue,
  totalValue: initialTotalValue,
  previousInsurer: initialPreviousInsurer,
  previousPolicyNumber: initialPreviousPolicyNumber,
  finalPremium: initialFinalPremium,
  vehicle: initialVehicle,
  extractedVehicle,
  onSubmit,
  motorFormData,
  setMotorErrors,
}) {
  const resolvedMotorProps = item?.motorProps || {};
  const resolvedMotorFormData = motorFormData || resolvedMotorProps.motorFormData || {};
  const resolvedSetMotorErrors = setMotorErrors || resolvedMotorProps.setMotorErrors;

  const fuelTypeOptions = [
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "CNG", label: "CNG" },
    { value: "LPG", label: "LPG" },
    { value: "Electric", label: "Electric" },
    { value: "Hybrid", label: "Hybrid" },
    { value: "Other", label: "Other" },
  ];

  // ----- State -----
  const [copied, setCopied] = useState(false);
  const [policyNumCopied, setPolicyNumCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrPassword, setOcrPassword] = useState('');
  const [isOcrUnlocked, setIsOcrUnlocked] = useState(false);

  const handleUnlockOcr = () => {
    if (ocrPassword.toLowerCase() === 'paas') {
      setIsOcrUnlocked(true);
      toast.success('OCR section unlocked');
    } else {
      toast.error('Incorrect password');
    }
  };

  const [formData, setFormData] = useState(() => readMotorPolicyFormDraft(item?.id) || ({
    policyNumber: initialPolicyNumber,
    insuranceCompany: initialInsuranceCompany,
    branchAddress: initialBranchAddress,
    productType: initialProductType,
    vehicleCategory: initialVehicleCategory,
    insuredName: initialInsuredName,
    panNumber: initialPanNumber,
    gstin: initialGstin,
    contactNumber: initialContactNumber,
    email: initialEmail,
    insuredAddress: initialInsuredAddress,
    policyDates: {
      startDate: toDisplayDateFormat(initialPolicyDates?.startDate),
      odExpireDate: toDisplayDateFormat(initialPolicyDates?.odExpireDate),
      tpExpireDate: toDisplayDateFormat(initialPolicyDates?.tpExpireDate),
    },
    dateOfIssue: toDisplayDateFormat(initialDateOfIssue),
    totalValue: initialTotalValue,
    previousInsurer: initialPreviousInsurer,
    previousPolicyNumber: initialPreviousPolicyNumber,
    finalPremium: { ...initialFinalPremium },
    vehicle: {
      ...initialVehicle,
      fuelType: normalizeFuelType(extractedVehicle?.fuelType || initialVehicle?.fuelType || ""),
      aadhaarFront: null,
      aadhaarBack: null,
      panCard: null,
      rcDocument: null,
      previousPolicyDocument: null,
      surveyReport: null,
    }
  }));

  useEffect(() => {
    // Rebuild the editable OCR form whenever a different parsed policy is displayed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData(readMotorPolicyFormDraft(item?.id) || ({
      policyNumber: initialPolicyNumber,
      insuranceCompany: initialInsuranceCompany,
      branchAddress: initialBranchAddress,
      productType: initialProductType,
      vehicleCategory: initialVehicleCategory,
      insuredName: initialInsuredName,
      panNumber: initialPanNumber,
      gstin: initialGstin,
      contactNumber: initialContactNumber,
      email: initialEmail,
      insuredAddress: initialInsuredAddress,
      policyDates: {
        startDate: toDisplayDateFormat(initialPolicyDates?.startDate),
        odExpireDate: toDisplayDateFormat(initialPolicyDates?.odExpireDate),
        tpExpireDate: toDisplayDateFormat(initialPolicyDates?.tpExpireDate),
      },
      dateOfIssue: toDisplayDateFormat(initialDateOfIssue),
      totalValue: initialTotalValue,
      previousInsurer: initialPreviousInsurer,
      previousPolicyNumber: initialPreviousPolicyNumber,
      finalPremium: { ...initialFinalPremium },
      vehicle: {
        ...initialVehicle,
        fuelType: normalizeFuelType(extractedVehicle?.fuelType || initialVehicle?.fuelType || ""),
        aadhaarFront: null,
        aadhaarBack: null,
        panCard: null,
        rcDocument: null,
        previousPolicyDocument: null,
        surveyReport: null,
      }
    }));
  }, [item?.id, initialPolicyNumber, initialInsuranceCompany, initialBranchAddress, initialProductType, initialVehicleCategory, initialInsuredName, initialPanNumber, initialGstin, initialContactNumber, initialEmail, initialInsuredAddress, initialPolicyDates, initialDateOfIssue, initialTotalValue, initialPreviousInsurer, initialPreviousPolicyNumber, initialFinalPremium, initialVehicle, extractedVehicle]);

  useEffect(() => {
    if (item?.id) saveMotorPolicyFormDraft(item.id, formData);
  }, [formData, item?.id]);

  const handleFieldChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleDateChange = (field, value) => setFormData(prev => ({ ...prev, policyDates: { ...prev.policyDates, [field]: value } }));
  const handlePremiumChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      finalPremium: { ...prev.finalPremium, [field]: value }
    }));
  };
  const handleVehicleChange = (field, value) => setFormData(prev => ({
    ...prev,
    vehicle: {
      ...prev.vehicle,
      [field]: value,
    }
  }));

  // ----- Form Submission -----
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const motorValidationErrors = {};
    let isValid = true;
    DROPDOWN_STEPS.forEach((step) => {
      if (!resolvedMotorFormData[step.name]) {
        motorValidationErrors[step.name] = `${step.label} selection is required.`;
        isValid = false;
      }
    });
    if (!isValid) {
      resolvedSetMotorErrors?.(motorValidationErrors);
      toast.error("Please fill in all Motor Entry dropdowns.");
      return;
    }

    const rawFile = item?.rawFile || null;
    if (!(rawFile instanceof File)) {
      toast.error("Please upload the policy PDF.");
      return;
    }

    const hasAadhaarFront = mergedVehicle.aadhaarFront instanceof File;
    const hasAadhaarBack = mergedVehicle.aadhaarBack instanceof File;
    const hasPanCard = mergedVehicle.panCard instanceof File;
    if (!hasAadhaarFront || !hasAadhaarBack || !hasPanCard) {
      toast.error("Aadhaar front, Aadhaar back and PAN card are required for every business type.");
      return;
    }

    const businessType = resolvedMotorFormData.businessType;
    const hasRcDocument = mergedVehicle.rcDocument instanceof File;
    const hasPreviousPolicy = mergedVehicle.previousPolicyDocument instanceof File;
    if (["Rollover", "BreakIN"].includes(businessType) && !hasRcDocument) {
      toast.error(`RC document is required for ${businessType}.`);
      return;
    }
    if (businessType === "Rollover" && !hasPreviousPolicy) {
      toast.error("Previous Policy document is required for Rollover.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...formData,
        vehicle: mergedVehicle,
        motorEntry: resolvedMotorFormData,
      };

      toast.loading("Uploading policy documents...", { id: "motor-submit" });
      const response = await submitPolicyData(rawFile, payload);
      if (!response?.success) throw new Error(response?.message || "Failed to submit policy data");

      toast.success("Policy documents saved successfully!", { id: "motor-submit" });
      if (onSubmit) onSubmit(response.data);
      resolvedMotorProps.onSubmitSuccess?.(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Failed to submit data", { id: "motor-submit" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mergedVehicle = {
    ...formData.vehicle,
    registrationNumber: formData.vehicle.registrationNumber || extractedVehicle?.registrationNumber,
    chassisNumber: extractedVehicle?.chassisNumber || "-",
    engineNumber: extractedVehicle?.engineNumber || "-",
    make: formData.vehicle.make || extractedVehicle?.make,
    model: formData.vehicle.model || extractedVehicle?.model,
    variant: formData.vehicle.variant || extractedVehicle?.variant,
    manufacturingYear: formData.vehicle.manufacturingYear || extractedVehicle?.manufacturingYear,
    fuelType: formData.vehicle.fuelType || normalizeFuelType(extractedVehicle?.fuelType),
    cubicCapacity: formData.vehicle.cubicCapacity || extractedVehicle?.cubicCapacity,
    seatingCapacity: formData.vehicle.seatingCapacity || extractedVehicle?.seatingCapacity,
    financierName: extractedVehicle?.financierName,
    gvw: formData.vehicle.gvw || extractedVehicle?.gvw,
    aadhaarFront: formData.vehicle.aadhaarFront,
    aadhaarBack: formData.vehicle.aadhaarBack,
    panCard: formData.vehicle.panCard,
    rcDocument: formData.vehicle.rcDocument,
    previousPolicyDocument: formData.vehicle.previousPolicyDocument,
    surveyReport: formData.vehicle.surveyReport,
    ncb:
      (formData.vehicle.ncb && formData.vehicle.ncb !== "-" ? formData.vehicle.ncb : "") ||
      (extractedVehicle?.ncb && extractedVehicle.ncb !== "-" ? extractedVehicle.ncb : "") ||
      extractNcb(item?.fullText || "") ||
      "-",
  };

  const matchedPolicy = getPolicyCategory(formData.productType, "");

  // ----- Render -----
  return (
    <ReusableForm
      onSubmit={handleFormSubmit}
      showHeader={false}
      showActions={false}
      formClassName=""
      sectionClassName="w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_15px_45px_rgb(0,0,0,0.05)]"
    >
      <style>{`
        .date-input-no-button::-webkit-calendar-picker-indicator { display: none !important; }
        @media (max-width: 640px) {
          input, textarea, button { font-size: 14px !important; }
        }
      `}</style>
        <div className="p-4 sm:p-6">

          {/* ===== POLICY HEADER ===== */}
          <div className="flex flex-col gap-3 pb-5 mb-5 border-b border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Policy Document</span>
                <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg px-2.5 py-1 shadow-sm">
                  <span className="text-xs font-bold text-slate-700 font-mono select-all">{formData.policyNumber}</span>
                  <Tooltip title={policyNumCopied ? "Copied!" : "Copy Policy Number"}>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); copyText(formData.policyNumber, setPolicyNumCopied); }}
                      className="ml-2 p-0.5 hover:bg-slate-200/50 rounded text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {policyNumCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {formData.insuranceCompany && formData.insuranceCompany !== "-" && (
                  <span className="bg-blue-50 text-blue-700 border border-blue-100/50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {formData.insuranceCompany}
                  </span>
                )}
                {formData.productType && formData.productType !== "-" && (
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {formData.productType}
                  </span>
                )}
                {formData.vehicleCategory && formData.vehicleCategory !== "-" && (
                  <span className="bg-amber-50 text-amber-700 border border-amber-100/50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    {formData.vehicleCategory}
                  </span>
                )}
              </div>
            </div>
            {formData.branchAddress && formData.branchAddress !== "-" && (
              <div className="flex items-center gap-2 text-slate-600 text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate font-medium" title={formData.branchAddress}>
                  {formData.branchAddress}
                </span>
              </div>
            )}
          </div>

          {/* ===== THREE COLUMNS ===== */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            {/* Insured Details */}
            <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-4 shadow-sm hover:bg-slate-50/40 transition-colors duration-200">
              <SectionHeader icon="👤" title="INSURED DETAILS" color="blue" />
              <EditableRow label="Name" value={formData.insuredName} onChange={(val) => handleFieldChange("insuredName", val)} />
              <EditableRow label="PAN" value={formData.panNumber} onChange={(val) => handleFieldChange("panNumber", val)} />
              <EditableRow label="GSTIN" value={formData.gstin} onChange={(val) => handleFieldChange("gstin", val)} />
              <EditableRow label="Contact" value={formData.contactNumber} onChange={(val) => handleFieldChange("contactNumber", val)} type="number" />
              <EditableRow label="Email" value={formData.email} onChange={(val) => handleFieldChange("email", val)} />
              <EditableRow label="Address" value={formData.insuredAddress} onChange={(val) => handleFieldChange("insuredAddress", val)} isTextarea />
            </div>

            {/* Policy Details */}
            <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-4 shadow-sm hover:bg-slate-50/40 transition-colors duration-200">
              <SectionHeader icon="📋" title="POLICY DETAILS" color="green" />
              <EditableRow label="Start Date" value={formData.policyDates?.startDate} onChange={(val) => handleDateChange("startDate", val)} isDate />
              <EditableRow label="OD Expiry" value={formData.policyDates?.odExpireDate} onChange={(val) => handleDateChange("odExpireDate", val)} isDate />
              <EditableRow label="TP Expiry" value={formData.policyDates?.tpExpireDate} onChange={(val) => handleDateChange("tpExpireDate", val)} isDate />
              <EditableRow label="Issue Date" value={formData.dateOfIssue} onChange={(val) => handleFieldChange("dateOfIssue", val)} isDate />
              <EditableRow label="IDV" value={formData.totalValue !== "-" ? formData.totalValue : ""} onChange={(val) => handleFieldChange("totalValue", val)} type="number" />
              <EditableRow label="Prev Insurer" value={formData.previousInsurer} onChange={(val) => handleFieldChange("previousInsurer", val)} />
              <EditableRow label="Prev Policy" value={formData.previousPolicyNumber} onChange={(val) => handleFieldChange("previousPolicyNumber", val)} />
            </div>

            {/* Premium Details */}
            <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-4 shadow-sm hover:bg-slate-50/40 transition-colors duration-200">
              <SectionHeader icon="💰" title="PREMIUM DETAILS" color="purple" />
              {shouldShowPremiumField(matchedPolicy, "calculatedOdPremium") && <EditableRow label="First Year OD" value={getPremiumValue(formData.finalPremium?.calculatedOdPremium)} onChange={(val) => handlePremiumChange("calculatedOdPremium", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "calculatedTpPremium") && <EditableRow label="First Year TP" value={getPremiumValue(formData.finalPremium?.calculatedTpPremium)} onChange={(val) => handlePremiumChange("calculatedTpPremium", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "totalOdPremium") && <EditableRow label="Total OD" value={getPremiumValue(formData.finalPremium?.totalOdPremium)} onChange={(val) => handlePremiumChange("totalOdPremium", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "totalTpPremium") && <EditableRow label="Total TP" value={getPremiumValue(formData.finalPremium?.totalTpPremium)} onChange={(val) => handlePremiumChange("totalTpPremium", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "netPremium") && <EditableRow label="Net Premium" value={getPremiumValue(formData.finalPremium?.netPremium)} onChange={(val) => handlePremiumChange("netPremium", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "gst") && <EditableRow label="GST" value={getPremiumValue(formData.finalPremium?.gst)} onChange={(val) => handlePremiumChange("gst", val)} type="number" />}
              {shouldShowPremiumField(matchedPolicy, "totalPayable") && <EditableRow label="Gross Premium" value={getPremiumValue(formData.finalPremium?.totalPayable)} onChange={(val) => handlePremiumChange("totalPayable", val)} type="number" highlight />}
            </div>
          </div>

          {/* ===== VEHICLE DETAILS ===== */}
          <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-4 mb-5 shadow-sm hover:bg-slate-50/40 transition-colors duration-200">
            <SectionHeader icon="🚗" title="VEHICLE DETAILS" color="light blue" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-2">
              <EditableRow label="Reg No" value={mergedVehicle.registrationNumber} onChange={(val) => handleVehicleChange("registrationNumber", val)} />
              <EditableRow label="Chassis No" value={mergedVehicle.chassisNumber} onChange={(val) => handleVehicleChange("chassisNumber", val)} />
              <EditableRow label="Engine No" value={mergedVehicle.engineNumber} onChange={(val) => handleVehicleChange("engineNumber", val)} />
              <EditableRow label="Make" value={mergedVehicle.make} onChange={(val) => handleVehicleChange("make", val)} />
              <EditableRow label="Model" value={mergedVehicle.model} onChange={(val) => handleVehicleChange("model", val)} />
              <EditableRow label="Variant" value={mergedVehicle.variant} onChange={(val) => handleVehicleChange("variant", val)} />
              <EditableRow label="Year" value={mergedVehicle.manufacturingYear} onChange={(val) => handleVehicleChange("manufacturingYear", val)} type="year" />
              <EditableRow label="Fuel" value={mergedVehicle.fuelType} onChange={(val) => handleVehicleChange("fuelType", val)} type="select" options={fuelTypeOptions} />
              <EditableRow label="CC" value={mergedVehicle.cubicCapacity} onChange={(val) => handleVehicleChange("cubicCapacity", val)} />
              
              {/* 🔥 Seating field – now plain text to accept "1+4" */}
              <EditableRow 
                label="Seating" 
                value={mergedVehicle.seatingCapacity} 
                onChange={(val) => handleVehicleChange("seatingCapacity", val)} 
                type="text" 
              />
              
              <EditableRow label="Financier" value={extractedVehicle?.financierName} onChange={(val) => handleVehicleChange("financierName", val)} />
              
              {formData.vehicleCategory === "Commercial Vehicle" && (
                <EditableRow label="GVW" value={mergedVehicle.gvw} onChange={(val) => handleVehicleChange("gvw", val)} />
              )}

              <EditableRow
                label="NCB"
                value={mergedVehicle.ncb}
                onChange={(val) => handleVehicleChange("ncb", val)}
              />

              <div className="sm:col-span-2 md:col-span-3 lg:col-span-4 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[11px] font-semibold text-blue-700">
                KYC required for every business type: Aadhaar front, Aadhaar back and PAN card.
              </div>
              <EditableRow label="Aadhaar Front *" value={mergedVehicle.aadhaarFront} onChange={(file) => handleVehicleChange("aadhaarFront", file)} type="file" />
              <EditableRow label="Aadhaar Back *" value={mergedVehicle.aadhaarBack} onChange={(file) => handleVehicleChange("aadhaarBack", file)} type="file" />
              <EditableRow label="PAN Card *" value={mergedVehicle.panCard} onChange={(file) => handleVehicleChange("panCard", file)} type="file" />

              {["Rollover", "BreakIN"].includes(resolvedMotorFormData.businessType) && (
                <EditableRow
                  label="RC Document *"
                  value={mergedVehicle.rcDocument}
                  onChange={(file) => handleVehicleChange("rcDocument", file)}
                  type="file"
                />
              )}
              {resolvedMotorFormData.businessType === "Rollover" && (
                <>
                  <EditableRow
                    label="Previous Policy *"
                    value={mergedVehicle.previousPolicyDocument}
                    onChange={(file) => handleVehicleChange("previousPolicyDocument", file)}
                    type="file"
                  />
                  <EditableRow
                    label="Survey Report (Optional)"
                    value={mergedVehicle.surveyReport}
                    onChange={(file) => handleVehicleChange("surveyReport", file)}
                    type="file"
                  />
                </>
              )}

              <div className="sm:col-span-2 md:col-span-3 lg:col-span-1 flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-6 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.18)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.28)] transition-all duration-300 text-xs flex items-center gap-2 select-none"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={12} color="inherit" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Policy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ===== OCR SECTION ===== */}
          <div className="mt-5 flex flex-col gap-3">
            {!isOcrUnlocked && (
              <div className="flex items-center gap-3">
                <input
                  type="password"
                  placeholder="Enter password to view OCR..."
                  value={ocrPassword}
                  onChange={(e) => setOcrPassword(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleUnlockOcr(); } }}
                  className="text-xs text-slate-800 font-medium bg-slate-50/30 hover:bg-slate-50/80 focus:bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-150 shadow-sm"
                />
                <button
                  type="button"
                  onClick={handleUnlockOcr}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] px-4 py-2 rounded-lg shadow-sm transition-colors uppercase tracking-wider"
                >
                  Unlock
                </button>
              </div>
            )}
            {isOcrUnlocked && (
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                <details className="group" open>
                  <summary className="cursor-pointer flex items-center justify-between p-4 select-none hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 text-slate-600">
                      <ChevronRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-90" />
                      <FileText className="h-4 w-4 text-blue-500" />
                      <span className="text-xs font-bold uppercase tracking-wider">View Extracted OCR Text</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip title={copied ? "Copied!" : "Copy Full Text"}>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyText(item?.fullText, setCopied); }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </Tooltip>
                      <Tooltip title="Lock OCR Text">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOcrUnlocked(false); setOcrPassword(''); }}
                          className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </summary>
                  <div className="p-4 border-t border-slate-100 bg-slate-950">
                    <pre className="text-emerald-400 overflow-auto max-h-[300px] text-[10px] leading-relaxed whitespace-pre-wrap font-mono break-words select-text">
                      {item?.fullText || "No text extracted"}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
    </ReusableForm>
  );
}

export default PolicyCardView;
