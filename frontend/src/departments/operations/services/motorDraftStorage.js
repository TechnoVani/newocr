const KEYS = Object.freeze({
  entry: "nib_motor_entry_draft_v1",
  policy: "nib_motor_policy_draft_v1",
  form: "nib_motor_policy_form_draft_v1",
});

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Unable to save Motor Entry draft:", error);
  }
};

export const readMotorEntryDraft = () => read(KEYS.entry);
export const saveMotorEntryDraft = (value) => write(KEYS.entry, value);

export const readMotorPolicyDraft = () => read(KEYS.policy);
export const saveMotorPolicyDraft = (policy) => {
  const serializablePolicy = { ...policy };
  delete serializablePolicy.rawFile;
  write(KEYS.policy, serializablePolicy);
};

export const readMotorPolicyFormDraft = (policyId) => {
  const draft = read(KEYS.form);
  return String(draft?.policyId) === String(policyId) ? draft.formData : null;
};

export const saveMotorPolicyFormDraft = (policyId, formData) => {
  const vehicle = {
    ...formData.vehicle,
    aadhaarFront: null,
    aadhaarBack: null,
    panCard: null,
    rcDocument: null,
    previousPolicyDocument: null,
    surveyReport: null,
  };
  write(KEYS.form, { policyId, formData: { ...formData, vehicle } });
};

export const clearMotorDrafts = () => {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
};
