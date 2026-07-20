import React, { useState, useMemo } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  { value: 1, label: "Jan" }, { value: 2, label: "Feb" },
  { value: 3, label: "Mar" }, { value: 4, label: "Apr" },
  { value: 5, label: "May" }, { value: 6, label: "Jun" },
  { value: 7, label: "Jul" }, { value: 8, label: "Aug" },
  { value: 9, label: "Sep" }, { value: 10, label: "Oct" },
  { value: 11, label: "Nov" }, { value: 12, label: "Dec" },
];

export default function MonthYearPicker({ month, year, onChange }) {
  const today = new Date();
  
  const [isOpen, setIsOpen] = useState(false);
  const [pickerView, setPickerView] = useState("months"); // "months" | "years"
  const [pickerYear, setPickerYear] = useState(year);

  const displayTitle = useMemo(
    () => new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)),
    [month, year]
  );

  const handleClose = () => {
    setIsOpen(false);
    setPickerView("months");
  };

  const toggleOpen = () => {
    if (isOpen) {
      handleClose();
    } else {
      setPickerYear(year); // Sync picker year to actual selected year on open
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
    onChange(selectedMonth, pickerYear);
    handleClose();
  };

  const selectThisMonth = () => {
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    onChange(currentMonth, currentYear);
    handleClose();
  };

  // Generate fixed years: [Last Year, Current Year, +1, +2, +3, +4, +5]
  const availableYears = useMemo(() => {
    const baseYear = today.getFullYear() - 1;
    return Array.from({ length: 7 }, (_, i) => baseYear + i);
  }, [today]);

  return (
    <div className="relative flex flex-col">
      <label className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Month</label>
      <button
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
                {pickerView === "months" ? pickerYear : "Select Year"}
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
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => selectMonth(item.value)}
                    className={`cursor-pointer rounded-xl py-2 text-[10.5px] font-bold transition-all duration-100 ${month === item.value && year === pickerYear ? "bg-[#1E88E5] text-white shadow-sm" : "text-slate-600 hover:bg-blue-50/50 hover:text-[#1E88E5]"}`}
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
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between border-t border-slate-100 pt-3 text-[10px] font-bold uppercase tracking-wider">
              <button type="button" className="text-[#1E88E5] transition-colors hover:text-[#1565C0] cursor-pointer" onClick={selectThisMonth}>This Month</button>
              <button type="button" className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" onClick={handleClose}>Close</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}