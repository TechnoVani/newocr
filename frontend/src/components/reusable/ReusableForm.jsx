import { RotateCcw, Save } from "lucide-react";

export const formControlClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60";
export const formLabelClass = "space-y-2";
export const formLabelTextClass = "text-[10px] font-bold uppercase tracking-wider text-slate-500";

export default function ReusableForm({
  title,
  icon: Icon,
  onSubmit,
  onReset,
  submitLabel = "Save Entry",
  children,
  gridClassName = "sm:grid-cols-2",
  message = "",
  messageType = "success",
  submitting = false,
  showHeader = true,
  showActions = true,
  sectionClassName = "",
  formClassName,
}) {
  const defaultSectionClass = "overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]";
  const defaultFormClass = `grid gap-4 p-4 sm:p-5 ${gridClassName}`;
  return (
    <section className={sectionClassName || defaultSectionClass}>
      {showHeader && <header className="flex flex-col items-start justify-between gap-2 bg-[#1E88E5] px-4 py-3 text-white shadow-sm sm:flex-row sm:items-center sm:px-5 sm:py-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider sm:text-sm">
          {Icon && <Icon size={17} aria-hidden="true" />}
          <span>{title}</span>
        </div>
        {onReset && (
          <button type="button" onClick={onReset} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase transition hover:bg-white/20 sm:w-auto">
            <RotateCcw size={13} aria-hidden="true" /> Clear Fields
          </button>
        )}
      </header>}
      <form onSubmit={onSubmit} className={formClassName ?? defaultFormClass}>
        {children}
        {showActions && <div className="flex flex-col gap-3 sm:col-span-full sm:flex-row sm:items-center sm:justify-end">
          {message && (
            <p role={messageType === "error" ? "alert" : "status"} className={`mr-auto text-xs font-bold ${messageType === "error" ? "text-red-600" : "text-emerald-600"}`}>{message}</p>
          )}
          <button type="submit" disabled={submitting} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#121212] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#252525] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
            <Save size={15} aria-hidden="true" /> {submitting ? "Saving..." : submitLabel}
          </button>
        </div>}
      </form>
    </section>
  );
}
