import ReactSelect from "react-select";

const getSearchSelectStyles = (hasError = false, minHeight = 44) => ({
  control: (provided, state) => ({
    ...provided,
    minHeight,
    borderColor: hasError ? "#ef4444" : state.isFocused ? "#1E88E5" : "#e2e8f0",
    borderRadius: "0.75rem",
    backgroundColor: state.isDisabled ? "#f1f5f9" : "#ffffff",
    boxShadow: state.isFocused
      ? hasError
        ? "0 0 0 2px rgba(239, 68, 68, 0.12)"
        : "0 0 0 2px rgba(30, 136, 229, 0.10)"
      : "0 1px 2px rgba(15, 23, 42, 0.04)",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    fontSize: "0.75rem",
    fontWeight: 600,
    transition: "border-color 150ms, box-shadow 150ms",
    "&:hover": { borderColor: hasError ? "#ef4444" : state.isFocused ? "#1E88E5" : "#cbd5e1" },
  }),
  valueContainer: (provided) => ({ ...provided, padding: "2px 14px" }),
  input: (provided) => ({ ...provided, color: "#334155", margin: 0 }),
  placeholder: (provided) => ({ ...provided, color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600 }),
  singleValue: (provided) => ({ ...provided, color: "#334155", fontSize: "0.75rem", fontWeight: 600 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (provided) => ({ ...provided, color: "#94a3b8", padding: 8 }),
  clearIndicator: (provided) => ({ ...provided, color: "#94a3b8", padding: 8 }),
  menu: (provided) => ({ ...provided, zIndex: 50, overflow: "hidden", border: "1px solid #e2e8f0", borderRadius: "0.75rem", boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)" }),
  menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#1E88E5" : state.isFocused ? "#eff6ff" : "#ffffff",
    color: state.isSelected ? "#ffffff" : "#334155",
    cursor: "pointer",
    fontSize: "0.75rem",
    fontWeight: 600,
    "&:active": { backgroundColor: state.isSelected ? "#1565C0" : "#dbeafe" },
  }),
  noOptionsMessage: (provided) => ({ ...provided, color: "#64748b", fontSize: "0.75rem" }),
});

export default function ReusableSearchSelect({ hasError = false, minHeight = 44, styles, ...props }) {
  return (
    <ReactSelect
      {...props}
      classNamePrefix="reusable-select"
      menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
      styles={styles || getSearchSelectStyles(hasError, minHeight)}
    />
  );
}
