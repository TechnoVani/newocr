import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Toaster } from "react-hot-toast";
import UploadSection from "../motorcompany/UploadSection";
import MotorEntrySection, { DROPDOWN_STEPS } from "../motorcompany/MotorEntrySection";
import axiosInstance from "../config/axios";
import { fetchBqp } from "../redux/actions/bqpActions";
import { fetchReportingManagers } from "../redux/actions/reportingActions";
import { fetchRelationshipManagers } from "../redux/actions/relationshipActions";
import { fetchPospByRelationshipManager } from "../redux/actions/posActions";

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
  const dispatch = useDispatch();
  const { data: bqpList, loading: bqpLoading } = useSelector((state) => state.bqp);
  const { byBqpId, loading: reportingLoading } = useSelector((state) => state.reporting);
  const { byManagerId, loading: relationshipLoading } = useSelector((state) => state.relationship);
  const { byRelationshipId, loading: posLoading } = useSelector((state) => state.pos);

  const [motorFormData, setMotorFormData] = useState({ ...EMPTY_MOTOR_FORM });

  const [localOptions, setLocalOptions] = useState({
    reference: [],
    businessType: BUSINESS_TYPES, // static options always available
  });
  const [localLoading, setLocalLoading] = useState({
    reference: false,
    businessType: false,
  });

  const [motorErrors, setMotorErrors] = useState({ ...EMPTY_MOTOR_ERRORS });

  const resetMotorEntry = () => {
    setMotorFormData({ ...EMPTY_MOTOR_FORM });
    setMotorErrors({ ...EMPTY_MOTOR_ERRORS });
    setLocalOptions({
      reference: [],
      businessType: BUSINESS_TYPES,
    });
    setLocalLoading({
      reference: false,
      businessType: false,
    });
  };

  // Initial BQP fetch
  useEffect(() => {
    if (!bqpList.length && !bqpLoading) {
      dispatch(fetchBqp());
    }
  }, [dispatch, bqpList.length, bqpLoading]);

  // Fetch references when POSP changes
  useEffect(() => {
    const pospId = motorFormData.posp;
    if (pospId) {
      const fetchReferences = async () => {
        setLocalLoading((prev) => ({ ...prev, reference: true }));
        try {
          const response = await axiosInstance.get(`/references/posp/${pospId}`);
          setLocalOptions((prev) => ({ ...prev, reference: response.data.data || [] }));
        } catch (error) {
          console.error("Error fetching references:", error);
          setLocalOptions((prev) => ({ ...prev, reference: [] }));
        } finally {
          setLocalLoading((prev) => ({ ...prev, reference: false }));
        }
      };
      fetchReferences();
    } else {
      setLocalOptions((prev) => ({ ...prev, reference: [] }));
      if (motorFormData.reference) {
        setMotorFormData((prev) => ({ ...prev, reference: "" }));
      }
    }
  }, [motorFormData.posp]);

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

    // Reset local options for subsequent steps (except businessType)
    const updatedLocalOptions = { ...localOptions };
    const updatedLocalLoading = { ...localLoading };
    for (let i = currentStepIndex + 1; i < DROPDOWN_STEPS.length; i++) {
      const stepName = DROPDOWN_STEPS[i].name;
      if (stepName === "reference") {
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

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < DROPDOWN_STEPS.length) {
      const nextStep = DROPDOWN_STEPS[nextStepIndex];

      if (fieldName === "bqp" && nextStep.name === "manager") {
        await dispatch(fetchReportingManagers(val));
      } else if (fieldName === "manager" && nextStep.name === "relationship") {
        await dispatch(fetchRelationshipManagers(val));
      } else if (fieldName === "relationship" && nextStep.name === "posp") {
        await dispatch(fetchPospByRelationshipManager(val));
      }
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
    bqp: bqpList,
    manager: byBqpId[motorFormData.bqp] || [],
    relationship: byManagerId[motorFormData.manager] || [],
    posp: byRelationshipId[motorFormData.relationship] || [],
    reference: formattedReferenceOptions,
    businessType: businessTypeOptions, // ✅ fallback to static options
  };

  const allLoading = {
    bqp: bqpLoading,
    manager: reportingLoading,
    relationship: relationshipLoading,
    posp: posLoading,
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
