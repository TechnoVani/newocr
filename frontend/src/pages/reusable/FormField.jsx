import React, { useState, useEffect, useCallback, useRef } from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { useDispatch, useSelector } from "react-redux";
import axiosInstance from "../../config/axios";
import { clientClear } from "../../redux/reducers/clientSlice";

const FormField = ({
  field,
  value,
  onChange,
  error,
  dependencies = {},
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
  onKeyDown,
  previousPolicyData,
  previousinsurerBranchData,
  previousinsurerBranchLoading,
  previousinsurerData,
}) => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);
  const debounceRef = useRef(null);

  let fieldValue = value;

  const handleChange = (newValue) => {
    if (field.type === "select") {
      if (field.name === "Cust_Name") {
        onChange(field.name, newValue ? newValue.details : "");
      } else {
        onChange(field.name, newValue ? newValue.value : "");
      }
    } else {
      onChange(
        field.name,
        field.transform ? field.transform(newValue) : newValue
      );
    }
  };

  const loadClientOptions = useCallback(
    (input, callback) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        if (!input || input.length < 2) {
          callback([]);
          return;
        }

        try {
          const response = await axiosInstance.get(
            `/getClient?search=${encodeURIComponent(input)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.data.success) {
            const options = response.data.data.map((client) => ({
              value: client.id,
              label: `${client.Client_Name} (${client.City}, ${client.State} - ${client.Zip_Code})`,
              details: client,
            }));
            callback(options);
          } else {
            callback([]);
          }
        } catch (error) {
          callback([]);
        }
      }, 1000);
    },
    [token]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      dispatch(clientClear());
    };
  }, [dispatch]);

  let options = field.options || [];

  if (field.optionsFromRef && refData) {
    options =refLoading
      ? [{ value: "loading", label: "Loading clients...", isDisabled: true }]
      :
      refData?.map((item) => ({
        value: `${item.name}-${item.mobile}`,
        label: `${item.name}-${item.mobile}`,
      })) || [];
  }

  if (field.optionsFromInsurer && insurerData) {
    options = Array.isArray(insurerData)
      ? insurerData.map((item) => ({
          value: item.Name_of_Insurer,
          label: item.Name_of_Insurer,
        }))
      : insurerData.data?.map((item) => ({
          value: item.Name_of_Insurer,
          label: item.Name_of_Insurer,
        })) || [];
  }

  if (field.optionsFromInsurerBranch) {
    options = insurerBranchLoading
      ? [{ value: "loading", label: "Loading branches...", isDisabled: true }]
      : insurerBranchData?.map((item) => ({
          value: `${item.GST_No} - ${item.Address} - ${item.City} - ${item.State} - ${item.Zip_Code}`,
          label: `${item.GST_No} - ${item.Address} - ${item.City} - ${item.State} - ${item.Zip_Code}`,
        })) || [];
  }

  if (field.option_Previous_Insurer && previousinsurerData) {
    options = Array.isArray(previousinsurerData)
      ? previousinsurerData.map((item) => ({
          value: item.id.toString(),
          label: item.Name_of_Insurer,
        }))
      : previousinsurerData.data?.map((item) => ({
          value: item.id.toString(),
          label: item.Name_of_Insurer,
        })) || [];
  }

  if (field.option_Previous_Insurer_Branch) {
    options = previousinsurerBranchLoading
      ? [{ value: "loading", label: "Loading branches...", isDisabled: true }]
      : previousinsurerBranchData?.map((item) => ({
          value: item.id.toString(),
          label: `${item.GST_No} - ${item.Address} - ${item.City} - ${item.State} - ${item.Zip_Code}`,
        })) || [];
  }

  if (field.optionsCity) {
    options = cityLoading
      ? [{ value: "loading", label: "Loading City...", isDisabled: true }]
      : cityData?.map((item) => ({ value: item.city, label: item.city })) || [];
  }

  if (field.optionsBank || field.optionsHypothecation) {
    options = bankLoading
      ? [{ value: "loading", label: "Loading bank...", isDisabled: true }]
      : bankData?.map((item) => ({
          value: item.Name_of_Bank,
          label: item.Name_of_Bank,
        })) || [];
  }

  if (field.dependency) {
    const depValue = dependencies[field.dependency];
    options = depValue ? field.options[depValue] || [] : [];
  }

  // Common styles for React Select
  const selectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "rgba(248, 250, 252, 0.3)",
      borderColor: error ? "#f43f5e" : state.isFocused ? "#3b82f6" : "#e2e8f0",
      borderRadius: "0.75rem",
      padding: "0.0625rem 0.25rem",
      fontSize: "0.75rem",
      fontWeight: "600",
      color: "#334155",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
      transition: "all 150ms ease",
      "&:hover": {
        borderColor: error ? "#f43f5e" : "#cbd5e1",
        backgroundColor: "rgba(248, 250, 252, 0.8)",
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
      fontSize: "0.75rem",
      fontWeight: "600",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#334155",
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 })
  };

  switch (field.type) {
    case "select": {
      let selectedOption =
        fieldValue && typeof fieldValue === "object" && fieldValue.value
          ? fieldValue
          : options.find((opt) => opt.value === fieldValue) || null;

      return (
        <div className="mb-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            {field.label}
          </label>
          {field.name === "Cust_Name" ? (
            <AsyncSelect
              cacheOptions
              defaultOptions
              loadOptions={loadClientOptions}
              getOptionLabel={(option) => `${option.label}`}
              getOptionValue={(option) => option.value}
              value={
                fieldValue && fieldValue.id
                  ? {
                      value: `${fieldValue.Client_Name} (${fieldValue.City}, ${fieldValue.State})`,
                      label: `${fieldValue.Client_Name} (${fieldValue.City}, ${fieldValue.State})`,
                      details: fieldValue,
                    }
                  : null
              }
              onChange={handleChange}
              isClearable
              placeholder={`Select ${field.label.replace("*", "").trim()}`}
              styles={selectStyles}
              menuPortalTarget={document.body}
            />
          ) : (
            <Select
              options={options}
              value={selectedOption}
              onChange={handleChange}
              isDisabled={
                (field.dependency && !dependencies[field.dependency]) ||
                (field.optionsFromInsurerBranch && (!insurerBranchData || insurerBranchData.length === 0)) ||
                (field.optionsFromRef && (!refData || refData.length === 0))
              }
              placeholder={`Select ${field.label.replace("*", "").trim()}`}
              menuPortalTarget={document.body}
              styles={selectStyles}
            />
          )}
          {error && <p className="text-rose-500 text-[10px] font-semibold mt-1">{error}</p>}
        </div>
      );
    }

    case "checkbox":
      return (
        <div className="flex items-center mb-4 mt-8">
          <input
            type="checkbox"
            id={field.name}
            checked={!!fieldValue}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
          />
          <label htmlFor={field.name} className="ml-2 text-xs font-bold text-slate-600 cursor-pointer">
            {field.label}
          </label>
        </div>
      );

    case "textarea":
      return (
        <div className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
          >
            {field.label}
          </label>
          <textarea
            id={field.name}
            value={fieldValue || ""}
            onChange={(e) => handleChange(e.target.value)}
            rows={field.rows || 3}
            className={`w-full bg-slate-50/30 hover:bg-slate-50/80 focus:bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-700 transition-all duration-150 shadow-sm
              ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 hover:border-slate-300"}`}
          />
          {error && <p className="text-rose-500 text-[10px] font-semibold mt-1">{error}</p>}
        </div>
      );

    case "date":
      const formattedValue = fieldValue
        ? fieldValue.includes("/") || fieldValue.includes("-")
          ? fieldValue.replaceAll("/", "-").split("-").reverse().join("-") // convert dd-mm-yyyy to yyyy-mm-dd for input
          : fieldValue
        : "";

      return (
        <div className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            type="date"
            value={formattedValue}
            onChange={(e) => {
              if (e.target.value) {
                const [year, month, day] = e.target.value.split("-");
                handleChange(`${day}-${month}-${year}`);
              } else handleChange("");
            }}
            className={`w-full bg-slate-50/30 hover:bg-slate-50/80 focus:bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-700 transition-all duration-150 shadow-sm cursor-pointer
              ${error ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 hover:border-slate-300"}`}
          />
          {error && <p className="text-rose-500 text-[10px] font-semibold mt-1">{error}</p>}
        </div>
      );

    case "file":
      return (
        <div className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            type="file"
            accept={field.accept || ".pdf,.jpg,.png"}
            onChange={(e) => handleChange(e.target.files[0] || null)}
            className="hidden"
          />
          <label
            htmlFor={field.name}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow hover:scale-[1.02] cursor-pointer transition-all duration-150"
          >
            Upload File
          </label>
          {fieldValue && typeof fieldValue === "object" && fieldValue.name && (
            <div className="mt-3 border border-slate-100 rounded-xl p-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {fieldValue.type?.startsWith("image/") ? (
                    <img
                      src={URL.createObjectURL(fieldValue)}
                      alt="preview"
                      className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                    />
                  ) : fieldValue.type === "application/pdf" ? (
                    <span className="px-2 py-1 text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 rounded-md">
                      PDF
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-md">
                      File
                    </span>
                  )}
                  <div className="flex flex-col">
                    <span className="text-slate-700 text-xs font-semibold truncate max-w-[150px]">
                      {fieldValue.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {(fieldValue.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange(null)}
                  className="text-rose-500 hover:text-rose-700 text-xs font-bold transition-colors duration-150"
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-rose-500 text-[10px] font-semibold mt-1">{error}</p>}
        </div>
      );

    default:
      return (
        <div className="mb-4">
          <label
            htmlFor={field.name}
            className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2"
          >
            {field.label}
          </label>
          <input
            id={field.name}
            type={field.type || "text"}
            value={fieldValue ?? field.defaultValue ?? ""}
            readOnly={field.readOnly}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            className={`w-full bg-slate-50/30 hover:bg-slate-50/80 focus:bg-white border rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-semibold text-slate-700 transition-all duration-150 shadow-sm
              ${
                field.readOnly
                  ? "bg-slate-100/50 text-slate-400 border-slate-100 cursor-not-allowed shadow-none"
                  : error
                  ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                  : "border-slate-200 hover:border-slate-300"
              }`}
          />
          {error && <p className="text-rose-500 text-[10px] font-semibold mt-1">{error}</p>}
        </div>
      );
  }
};

export default FormField;
