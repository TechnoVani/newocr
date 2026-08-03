import { useState } from "react";
import { Check, History } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";
import MonthYearPicker from "../../../pages/reusable/MonthYearPicker";

function WorkflowAction({ row, onStatusChange, onHistory }) {
  const [nextStatus, setNextStatus] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(null);
  const transitions = row.allowedTransitions || [];

  const apply = async () => {
    if (!nextStatus) return;
    setBusy(true);
    setError("");
    try {
      await onStatusChange(row.id, nextStatus, note);
      setNextStatus("");
      setNote("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update workflow.");
    } finally {
      setBusy(false);
    }
  };

  const toggleHistory = async () => {
    if (history) {
      setHistory(null);
      return;
    }
    try {
      setHistory(await onHistory(row.id));
    } catch {
      setError("Unable to load workflow history.");
    }
  };

  return (
    <div className="min-w-64 space-y-2 whitespace-normal">
      <div className="flex items-center gap-2">
        <label className="relative block pt-2">
          <span className="pointer-events-none absolute left-2 top-0 z-10 bg-white px-1 text-[8px] font-bold uppercase leading-none tracking-wider text-slate-500">Next status</span>
          <select value={nextStatus} disabled={!transitions.length || busy} onChange={(event) => setNextStatus(event.target.value)} className="h-8 min-w-28 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-700">
            <option value="">{transitions.length ? "Next status" : "Workflow closed"}</option>
            {transitions.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <button type="button" onClick={apply} disabled={!nextStatus || busy} className="flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-2 text-[9px] font-bold uppercase text-white disabled:opacity-40">
          <Check size={12}/>{busy ? "Saving" : "Apply"}
        </button>
        <button type="button" onClick={toggleHistory} className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[9px] font-bold uppercase text-slate-600">
          <History size={12}/>History
        </button>
      </div>
      {nextStatus && <label className="relative block pt-2">
        <span className="pointer-events-none absolute left-2 top-0 z-10 bg-white px-1 text-[8px] font-bold uppercase leading-none tracking-wider text-slate-500">Transition note</span>
        <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Optional note" className="h-8 w-full rounded-lg border border-slate-200 px-2 text-[10px] outline-none focus:border-blue-500"/>
      </label>}
      {error && <p className="text-[9px] font-bold text-red-600">{error}</p>}
      {history && <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-2">
        {history.length ? history.map((item) => <div key={item.id} className="text-[9px] text-slate-600">
          <span className="font-bold">{item.fromStatus || "Created"} → {item.toStatus}</span>
          <span> · {item.changedBy || "System"}</span>
          {item.note && <p>{item.note}</p>}
        </div>) : <p className="text-[9px] text-slate-400">No history found.</p>}
      </div>}
    </div>
  );
}

export default function DepartmentReportsPage({ rows, columns, filterFields, filters, onFilterChange, onResetFilters, onStatusChange, onHistory }) {
  const tableFilters = filterFields
    .filter(({ type }) => type !== "search")
    .map((field) => {
      if (field.type === "month") {
        const value = filters[field.name] || "";
        const [year, month] = value.split("-").map(Number);
        return {
          ...field,
          label: "",
          render: <MonthYearPicker
            label={field.label}
            month={month}
            year={year}
            clearable={false}
            onChange={(nextMonth, nextYear) => onFilterChange(field.name, `${nextYear}-${String(nextMonth).padStart(2, "0")}`)}
          />,
        };
      }
      return {
        ...field,
        value: filters[field.name],
        onChange: (event) => onFilterChange(field.name, event.target.value),
      };
    });

  const workflowColumns = onStatusChange ? [
    ...columns,
    {
      key: "workflow_action",
      label: "Workflow Action",
      render: (_, row) => <WorkflowAction row={row} onStatusChange={onStatusChange} onHistory={onHistory}/>,
    },
  ] : columns;

  return (
    <ReusableTable
      title="Department Workflow Report"
      rows={rows}
      columns={workflowColumns}
      filters={tableFilters}
      onResetFilters={onResetFilters}
      searchConfig={{ value: filters.search, onChange: (event) => onFilterChange("search", event.target.value), clientSide: false }}
      emptyMessage="No department workflow records found."
    />
  );
}
