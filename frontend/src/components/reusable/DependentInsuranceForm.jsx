import { useMemo, useState } from "react";
import { ClipboardPlus } from "lucide-react";
import ReusableForm, { formControlClass, formLabelClass, formLabelTextClass } from "./ReusableForm";
import ReusableSelect from "./ReusableSelect";

export default function DependentInsuranceForm({ title, fields = [], onSubmit }) {
  const initial = useMemo(() => Object.fromEntries(fields.map(({ name }) => [name, ""])), [fields]);
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const optionsFor = (field) => field.dependsOn ? (field.optionMap?.[values[field.dependsOn]] || field.defaultOptions || []) : (field.options || []);
  const update = (field, value) => {
    setSaved(false);
    setError("");
    setValues((current) => {
      const next = { ...current, [field.name]: value };
      fields.filter((item) => item.dependsOn === field.name).forEach((item) => { next[item.name] = ""; });
      return next;
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit?.(values);
      setSaved(true);
    } catch (submissionError) {
      setError(submissionError.response?.data?.message || submissionError.message || "Unable to save entry.");
    } finally {
      setSubmitting(false);
    }
  };
  const reset = () => {
    setValues(initial);
    setSaved(false);
    setError("");
  };

  return (
    <ReusableForm
      title={title}
      icon={ClipboardPlus}
      onSubmit={submit}
      onReset={reset}
      submitting={submitting}
      message={error || (saved ? "Entry saved successfully." : "")}
      messageType={error ? "error" : "success"}
    >
      {fields.map((field) => {
        const options = optionsFor(field);
        const disabled = Boolean(field.dependsOn && !values[field.dependsOn]);
        return (
          <label key={field.name} className={formLabelClass}>
            <span className={formLabelTextClass}>{field.label}{field.required && <span className="text-red-500"> *</span>}</span>
            {field.type === "select" ? (
              <ReusableSelect required={field.required} disabled={disabled} value={values[field.name] || ""} onChange={(event) => update(field, event.target.value)}>
                <option value="">Select {field.label}</option>
                {options.map((option) => <option key={option} value={option}>{option}</option>)}
              </ReusableSelect>
            ) : (
              <input required={field.required} type={field.type || "text"} value={values[field.name] || ""} onChange={(event) => update(field, event.target.value)} className={formControlClass} placeholder={`Enter ${field.label.toLowerCase()}`} />
            )}
          </label>
        );
      })}
    </ReusableForm>
  );
}
