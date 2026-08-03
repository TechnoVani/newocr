import { useId, useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  { value: 4, label: "Apr" }, { value: 5, label: "May" },
  { value: 6, label: "Jun" }, { value: 7, label: "Jul" },
  { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
  { value: 10, label: "Oct" }, { value: 11, label: "Nov" },
  { value: 12, label: "Dec" }, { value: 1, label: "Jan" },
  { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
];

const getFinancialYearStart = (month, year) => {
  const numericMonth = Number(month);
  const numericYear = Number(year);
  if (!Number.isInteger(numericMonth) || !Number.isInteger(numericYear)) return new Date().getFullYear();
  return numericMonth >= 4 ? numericYear : numericYear - 1;
};

const getCalendarYearForFinancialMonth = (month, financialYearStart) =>
  Number(month) >= 4 ? Number(financialYearStart) : Number(financialYearStart) + 1;

const formatFinancialYear = (financialYearStart) =>
  `FY ${financialYearStart}-${String(financialYearStart + 1).slice(-2)}`;

export default function MonthYearPicker({ month, year, onChange, label = "Month", clearable = true }) {
  const inputId = useId();
  const today = useMemo(() => new Date(), []);
  const hasSelection = month !== null && month !== undefined &&
    year !== null && year !== undefined &&
    Number.isInteger(Number(month)) && Number(month) >= 1 && Number(month) <= 12 &&
    Number.isInteger(Number(year));
  
  const [isOpen, setIsOpen] = useState(false);
  const [pickerView, setPickerView] = useState("months"); // "months" | "years"
  const currentFinancialYearStart = useMemo(
    () => getFinancialYearStart(today.getMonth() + 1, today.getFullYear()),
    [today]
  );
  const [pickerYear, setPickerYear] = useState(
    hasSelection ? getFinancialYearStart(month, year) : currentFinancialYearStart
  );

  const displayTitle = useMemo(
    () => hasSelection
      ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1))
      : "Select month",
    [hasSelection, month, year]
  );

  const handleClose = () => {
    setIsOpen(false);
    setPickerView("months");
  };

  const toggleOpen = () => {
    if (isOpen) {
      handleClose();
    } else {
      setPickerYear(hasSelection ? getFinancialYearStart(month, year) : currentFinancialYearStart);
      setIsOpen(true);
    }
  };

  const handlePrev = () => {
    if (pickerView === "months") setPickerYear((prev) => prev - 1);
  };

  const handleNext = () => {
    if (pickerView === "months") setPickerYear((prev) => prev + 1);
  };

  const selectMonth = (selectedMonth) => {
    onChange(selectedMonth, getCalendarYearForFinancialMonth(selectedMonth, pickerYear));
    handleClose();
  };

  const selectThisMonth = () => {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    onChange(currentMonth, currentYear);
    handleClose();
  };

  const clearSelection = () => {
    onChange(null, null);
    handleClose();
  };

  // Generate fixed years: [Last Year, Current Year, +1, +2, +3, +4, +5]
  const availableYears = useMemo(() => {
    const baseYear = currentFinancialYearStart - 1;
    return Array.from({ length: 7 }, (_, i) => baseYear + i);
  }, [currentFinancialYearStart]);

  return (
    <div className="relative flex flex-col pt-2">
      <label htmlFor={inputId} className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">{label}</label>
      <button
        id={inputId}
        type="button"
        onClick={toggleOpen}
        className="flex w-44 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-[#1E88E5] focus:outline-none focus:ring-2 focus:ring-blue-500/10"
      >
        <span className="flex items-center gap-2"><Calendar size={13} className="text-[#1E88E5]" />{displayTitle}</span>
        <span className="text-[8px] text-slate-400">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <>
          <button type="button" aria-label="Close month picker" className="fixed inset-0 z-10 cursor-default" onClick={handleClose} />
          <div className="absolute left-0 top-[54px] z-20 w-64 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl transition-all duration-150">
            
            {/* Header */}
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
              <button 
                type="button" 
                onClick={handlePrev} 
                disabled={pickerView === "years"}
                className={`rounded-lg p-1 text-slate-500 transition-colors ${pickerView === "years" ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 hover:text-slate-700"}`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPickerView(pickerView === "months" ? "years" : "months")}
                className="rounded px-2 py-1 text-xs font-bold tracking-wider text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#1E88E5]"
                title={pickerView === "months" ? "Switch to Year View" : "Switch to Month View"}
              >
                {pickerView === "months" ? formatFinancialYear(pickerYear) : "Select Year"}
              </button>
              <button 
                type="button" 
                onClick={handleNext} 
                disabled={pickerView === "years"}
                className={`rounded-lg p-1 text-slate-500 transition-colors ${pickerView === "years" ? "opacity-30 cursor-not-allowed" : "hover:bg-slate-50 hover:text-slate-700"}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Body */}
            {pickerView === "months" ? (
              <div className="mb-3 grid grid-cols-4 gap-2">
                {MONTHS.map((item) => (
                  /* Jan-Mar belong to the next calendar year inside the selected financial year. */
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => selectMonth(item.value)}
                    className={`cursor-pointer rounded-xl py-2 text-[10.5px] font-bold transition-all duration-100 ${Number(month) === item.value && Number(year) === getCalendarYearForFinancialMonth(item.value, pickerYear) ? "bg-[#1E88E5] text-white shadow-sm" : "text-slate-600 hover:bg-blue-50/50 hover:text-[#1E88E5]"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mb-3 grid grid-cols-4 gap-2">
                {availableYears.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setPickerYear(y);
                      setPickerView("months");
                    }}
                    className={`cursor-pointer rounded-xl py-2 text-[10.5px] font-bold transition-all duration-100 ${
                      pickerYear === y
                        ? "bg-[#1E88E5] text-white shadow-sm"
                        : "text-slate-600 hover:bg-blue-50/50 hover:text-[#1E88E5]"
                    }`}
                    title={formatFinancialYear(y)}
                  >
                    {`${y}-${String(y + 1).slice(-2)}`}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-wider">
              <button type="button" className="text-[#1E88E5] transition-colors hover:text-[#1565C0] cursor-pointer" onClick={selectThisMonth}>This Month</button>
              {clearable && hasSelection && <button type="button" className="cursor-pointer text-rose-500 transition-colors hover:text-rose-700" onClick={clearSelection}>Clear</button>}
              <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={handleClose}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
