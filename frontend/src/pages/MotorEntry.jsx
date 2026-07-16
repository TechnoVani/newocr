import { useState, useEffect, useCallback, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import UploadSection from "../motorcompany/UploadSection";
import MotorEntrySection, { DROPDOWN_STEPS } from "../motorcompany/MotorEntrySection";
import { hierarchyApi } from "../services/hierarchyApi";

// Static business type options
const BUSINESS_TYPES = [
  { id: "New", name: "New" },
  { id: "NIB Renewal", name: "NIB Renewal" },
  { id: "Rollover", name: "Rollover" },
  { id: "BreakIN", name: "BreakIN" },
];

const EMPTY_MOTOR_FORM = {
  bqp: "",
  manager: "",
  relationship: "",
  posp: "",
  reference: "",
  businessType: "",
};

const EMPTY_MOTOR_ERRORS = {
  bqp: "",
  manager: "",
  relationship: "",
  posp: "",
  reference: "",
  businessType: "",
};

export default function MotorEntry() {
  const requestIds = useRef({});
  const [motorFormData, setMotorFormData] = useState({ ...EMPTY_MOTOR_FORM });

  const [localOptions, setLocalOptions] = useState({
    bqp: [],
    manager: [],
    relationship: [],
    posp: [],
    reference: [],
    businessType: BUSINESS_TYPES,
  });
  const [localLoading, setLocalLoading] = useState({
    bqp: false,
    manager: false,
    relationship: false,
    posp: false,
    reference: false,
    businessType: false,
  });

  const [motorErrors, setMotorErrors] = useState({ ...EMPTY_MOTOR_ERRORS });

  const resetMotorEntry = () => {
    ["manager", "relationship", "posp", "reference"].forEach((fieldName) => {
      requestIds.current[fieldName] = (requestIds.current[fieldName] || 0) + 1;
    });
    setMotorFormData({ ...EMPTY_MOTOR_FORM });
    setMotorErrors({ ...EMPTY_MOTOR_ERRORS });
    setLocalOptions((prev) => ({
      ...prev,
      manager: [], relationship: [], posp: [], reference: [],
      businessType: BUSINESS_TYPES,
    }));
    setLocalLoading((prev) => ({
      ...prev,
      manager: false, relationship: false, posp: false, reference: false,
      businessType: false,
    }));
  };

  const loadDirectOptions = useCallback(async (fieldName, request) => {
    const requestId = (requestIds.current[fieldName] || 0) + 1;
    requestIds.current[fieldName] = requestId;
    setLocalLoading((prev) => ({ ...prev, [fieldName]: true }));
    try {
      const data = await request();
      if (requestIds.current[fieldName] !== requestId) return [];
      setLocalOptions((prev) => ({ ...prev, [fieldName]: data }));
      return data;
    } catch (error) {
      if (requestIds.current[fieldName] !== requestId) return [];
      setLocalOptions((prev) => ({ ...prev, [fieldName]: [] }));
      toast.error(error.response?.data?.message || error.message || `Failed to load ${fieldName}`);
      return [];
    } finally {
      if (requestIds.current[fieldName] === requestId) {
        setLocalLoading((prev) => ({ ...prev, [fieldName]: false }));
      }
    }
  }, []);

  // Read the current BQP list directly from the backend on every page mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDirectOptions("bqp", hierarchyApi.getBqps);
  }, [loadDirectOptions]);

  const handleMotorChange = async (fieldName, val) => {
    const updatedForm = { ...motorFormData, [fieldName]: val || "" };
    const currentStepIndex = DROPDOWN_STEPS.findIndex((step) => step.name === fieldName);

    // Clear subsequent steps, but keep businessType
    for (let i = currentStepIndex + 1; i < DROPDOWN_STEPS.length; i++) {
      const step = DROPDOWN_STEPS[i];
      if (step.name !== "businessType") {
        updatedForm[step.name] = "";
      }
    }
    setMotorFormData(updatedForm);

    // Clear errors for subsequent steps
    const updatedErrors = { ...motorErrors, [fieldName]: "" };
    for (let i = currentStepIndex + 1; i < DROPDOWN_STEPS.length; i++) {
      updatedErrors[DROPDOWN_STEPS[i].name] = "";
    }
    setMotorErrors(updatedErrors);

    // Clear dependent API results so stale database rows are never reused.
    const updatedLocalOptions = { ...localOptions };
    const updatedLocalLoading = { ...localLoading };
    for (let i = currentStepIndex + 1; i < DROPDOWN_STEPS.length; i++) {
      const stepName = DROPDOWN_STEPS[i].name;
      if (["manager", "relationship", "posp", "reference"].includes(stepName)) {
        requestIds.current[stepName] = (requestIds.current[stepName] || 0) + 1;
        updatedLocalOptions[stepName] = [];
        updatedLocalLoading[stepName] = false;
      } else if (stepName === "businessType") {
        // ✅ Keep static options; ensure they are never cleared
        updatedLocalOptions[stepName] = BUSINESS_TYPES;
        updatedLocalLoading[stepName] = false;
      }
    }
    setLocalOptions(updatedLocalOptions);
    setLocalLoading(updatedLocalLoading);

    if (!val) return;

    if (fieldName === "bqp") {
      await loadDirectOptions("manager", () => hierarchyApi.getReportingManagers(val));
    } else if (fieldName === "manager") {
      await loadDirectOptions("relationship", () => hierarchyApi.getRelationshipManagers(val));
    } else if (fieldName === "relationship") {
      await loadDirectOptions("posp", () => hierarchyApi.getPosps(val));
    } else if (fieldName === "posp") {
      await loadDirectOptions("reference", () => hierarchyApi.getReferences(val));
    }
  };

  // Format reference options to show name + mobile
  const formattedReferenceOptions = localOptions.reference.map((ref) => ({
    ...ref,
    name: `${ref.name}${ref.mobile ? ` (${ref.mobile})` : ""}`,
  }));

  // ✅ Ensure businessType always has options, even if localOptions is empty
  const businessTypeOptions = localOptions.businessType && localOptions.businessType.length > 0
    ? localOptions.businessType
    : BUSINESS_TYPES;

  // Combine all options
  const allOptions = {
    bqp: localOptions.bqp,
    manager: localOptions.manager,
    relationship: localOptions.relationship,
    posp: localOptions.posp,
    reference: formattedReferenceOptions,
    businessType: businessTypeOptions, // ✅ fallback to static options
  };

  const allLoading = {
    bqp: localLoading.bqp,
    manager: localLoading.manager,
    relationship: localLoading.relationship,
    posp: localLoading.posp,
    reference: localLoading.reference,
    businessType: localLoading.businessType,
  };

  // 🔥 Business Type always enabled
  const isMotorStepDisabled = (index) => {
    const stepName = DROPDOWN_STEPS[index].name;
    if (stepName === "businessType") return false; // always active
    if (index === 0) return false;
    const parentStep = DROPDOWN_STEPS[index - 1];
    return !motorFormData[parentStep.name];
  };

  const motorProps = {
    motorFormData,
    motorOptions: allOptions,
    motorLoading: allLoading,
    motorErrors,
    setMotorErrors,
    onMotorChange: handleMotorChange,
    isMotorStepDisabled,
    onSubmitSuccess: resetMotorEntry,
  };

  return (
    <div>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <UploadSection motorProps={motorProps}>
        <MotorEntrySection
          motorFormData={motorFormData}
          motorOptions={allOptions}
          motorLoading={allLoading}
          motorErrors={motorErrors}
          onMotorChange={handleMotorChange}
          isMotorStepDisabled={isMotorStepDisabled}
        />
      </UploadSection>
    </div>
  );
}
