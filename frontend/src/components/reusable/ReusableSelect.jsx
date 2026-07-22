import { ChevronDown } from "lucide-react";

const sizeClasses = {
  default: "h-11 px-4 pr-10 text-xs",
  compact: "h-9 px-3 pr-9 text-xs",
};

const selectControlClass = "w-full appearance-none rounded-xl border border-slate-200 bg-white font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-70";

export default function ReusableSelect({ children, className = "", wrapperClassName = "", size = "default", ...props }) {
  return (
    <span className={`relative block w-full ${wrapperClassName}`}>
      <select {...props} className={`${selectControlClass} ${sizeClasses[size] || sizeClasses.default} ${className}`}>
        {children}
      </select>
      <ChevronDown size={15} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </span>
  );
}
