import { AlertCircle } from 'lucide-react';
import ReusableSearchSelect from '../../../components/reusable/ReusableSearchSelect';

// Shared with the entry screens and policy card.
// eslint-disable-next-line react-refresh/only-export-components
export const DROPDOWN_STEPS = [
  { name: "bqp", label: "BQP", endpoint: "/bqp", paramName: null, placeholder: "Select BQP" },
  { name: "manager", label: "Reporting Manager", endpoint: "/bqp", paramName: "bqpId", placeholder: "Select Manager" },
  { name: "relationship", label: "Relationship Manager", endpoint: "/relationships", paramName: "managerId", placeholder: "Select Relationship" },
  { name: "posp", label: "POSP (Point of Sale)", endpoint: "/posp", paramName: "relationshipId", placeholder: "Select POSP" },
  { name: "reference", label: "Reference Number", placeholder: "Select Reference" },
  { name: "businessType", label: "Business Type", placeholder: "Select Business Type" },
];

const MotorEntrySection = ({
  motorFormData,
  motorOptions,
  motorLoading,
  motorErrors,
  onMotorChange,
  isMotorStepDisabled,
}) => {
  // Format option label with code (employee_code or pos_code)
  const formatOptionLabel = (option) => {
    const code = option.employee_code || option.pos_code || '';
    return code ? `${option.name} (${code})` : option.name;
  };

  return (
    <div className="bg-slate-50/20 border border-slate-100 rounded-2xl p-4 h-full shadow-sm">
      <div className="bg-[#1E88E5] text-white font-bold text-xs tracking-wider uppercase px-4 py-3 rounded-xl flex items-center justify-between shadow-sm mb-4">
        <div className="flex items-center gap-2">
          <span>🚗</span> OFFICE ENTRY DETAILS
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
        {DROPDOWN_STEPS.map((step, idx) => {
          const disabled = isMotorStepDisabled(idx);
          const hasError = !!motorErrors[step.name];
          return (
            <div key={step.name} className="flex flex-col">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                {step.label}
              </label>
              <ReusableSearchSelect
                hasError={hasError}
                minHeight={40}
                name={step.name}
                value={
                  motorFormData[step.name]
                    ? {
                        value: motorFormData[step.name],
                        label: (() => {
                          const found = motorOptions[step.name]?.find(
                            (o) => o.id.toString() === motorFormData[step.name]
                          );
                          return found ? formatOptionLabel(found) : motorFormData[step.name];
                        })(),
                      }
                    : null
                }
                onChange={(selected) => {
                  const val = selected ? selected.value : "";
                  onMotorChange(step.name, val);
                }}
                options={(motorOptions[step.name] || []).map((opt) => ({
                  value: opt.id.toString(),
                  label: formatOptionLabel(opt),
                  ...opt, // keep original data
                }))}
                isDisabled={disabled}
                isLoading={motorLoading[step.name]}
                isSearchable={true}
                placeholder={step.placeholder}
                noOptionsMessage={() => "No Data Available"}
              />
              {hasError && (
                <div className="flex items-center gap-1 mt-1.5 text-red-500">
                  <AlertCircle size={10} className="shrink-0" />
                  <span className="text-[9px] font-bold">{motorErrors[step.name]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MotorEntrySection;
