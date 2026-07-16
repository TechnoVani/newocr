import React from "react";
import FormField from "./FormField";

const FormSection = ({
  title,
  fields,
  formData,
  onChange,
  errors = {},

  refData,
  refLoading,
  refError,

  insurerData,
  insurerBranchData,
  insurerBranchLoading,
  cityData,
  cityLoading,
  bankData,
  bankLoading,
  onPolicyNoKeyDown, // Add this prop
  onPolicyNoChange, // Add this prop
  previousPolicyData, // Add this prop



  previousinsurerBranchData,
  previousinsurerBranchLoading,
  previousinsurerBranchError,

  previousinsurerData,
  previousinsurerLoading,
  previousinsurerError,
}) => {
  return (
    <div className="space-y-6">
      {title && (
        <h3 className="text-xl font-semibold text-blue-gray-800">{title}</h3>
      )}

      <div
        className={`grid grid-cols-1 ${
          fields.length > 5 ? "md:grid-cols-2 lg:grid-cols-3" : ""
        } gap-6`}
      >
        {fields.map((field) => {
          // handle conditional visibility for the field itself (showIf)
          if (field.showIf) {
            const depVal = formData?.[field.showIf.field];
            if (depVal !== field.showIf.value) return null;
          }

          // Special handling for Previous_Policyno field
          let specialProps = {};
          if (field.name === "Previous_Policy_No") {
            if (onPolicyNoKeyDown) {
              specialProps.onKeyDown = onPolicyNoKeyDown;
            }
            if (onPolicyNoChange) {
              specialProps.onChange = (name, value) =>
                onPolicyNoChange(name, value);
            }
          }

          return (
            <FormField
              key={field.name}
              field={field}
              value={formData?.[field.name]}
              onChange={specialProps.onChange || onChange} // Use custom onChange if provided
              error={errors?.[field.name]}
              dependencies={formData}
              refData={refData}
               
              refLoading={refLoading} 
              refError={refError}

              insurerData={insurerData}
              insurerBranchData={insurerBranchData}
              insurerBranchLoading={insurerBranchLoading}
              cityData={cityData}
              cityLoading={cityLoading}
              bankData={bankData}
              bankLoading={bankLoading}
              onKeyDown={specialProps.onKeyDown} // Pass keydown handler
              previousPolicyData={previousPolicyData} // Add this prop
              previousinsurerBranchData={previousinsurerBranchData}
              previousinsurerBranchLoading={previousinsurerBranchLoading}
              previousinsurerBranchError={previousinsurerBranchError}
              previousinsurerData={previousinsurerData}
              previousinsurerLoading={previousinsurerLoading}
              previousinsurerError={previousinsurerError}
            />
          );
        })}
      </div>
    </div>
  );
};

export default FormSection;

