import { useMemo, useState } from "react";
import { Download, RotateCcw, Search } from "lucide-react";
import ReusableSelect from "./ReusableSelect";
import ReusableSearchSelect from "./ReusableSearchSelect";

const normalizeFilterOptions = (options = []) => options.map((option) => ({
  value: typeof option === "object" ? option.value : option,
  label: typeof option === "object" ? option.label : option,
}));

function SearchableTableFilter({ filter, onChange }) {
  const options = normalizeFilterOptions(filter.options);
  const selected = options.find((option) => String(option.value) === String(filter.value ?? "")) || null;

  return (
    <ReusableSearchSelect
      minHeight={36}
      value={selected}
      options={options}
      onChange={(option) => onChange({
        target: {
          name: filter.name,
          value: option?.value ?? "",
        },
      })}
      isSearchable={filter.searchable !== false}
      isClearable={Boolean(filter.clearable)}
      placeholder={filter.placeholder || `Search ${filter.label}`}
      noOptionsMessage={({ inputValue }) => inputValue ? `No ${filter.label} found` : "No options available"}
      aria-label={filter.label}
    />
  );
}

export default function ReusableTable({
  title,
  subtitle = "",
  headerAction,
  rows = [],
  columns = [],
  pageSize = 10,
  emptyMessage = "No records found",
  filters = [],
  onResetFilters,
  onExport,
  exportLabel = "Export Excel",
  recordLabel = "records",
  countSuffix = "",
  loading = false,
  loadingMessage = "Loading report...",
  error = "",
  searchConfig,
  pageSizeOptions = [10, 20],
  pagination,
  serialHeaderClassName = "",
  serialCellClassName = "",
}) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(pageSizeOptions.includes(pageSize) ? pageSize : pageSizeOptions[0]);
  const [search, setSearch] = useState("");
  const searchText = searchConfig?.value ?? search;
  const effectiveRowsPerPage = pagination?.pageSize ?? rowsPerPage;
  const filtered = useMemo(() => {
    if (searchConfig?.clientSide === false) return rows;
    const query = searchText.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => columns.some(({ key, searchValue }) => String(searchValue ? searchValue(row) : row[key] ?? "").toLowerCase().includes(query)));
  }, [columns, rows, searchConfig?.clientSide, searchText]);
  const pages = pagination?.pages ?? Math.max(1, Math.ceil(filtered.length / effectiveRowsPerPage));
  const safePage = Math.min(pagination?.page ?? page, pages);
  const pageStart = (safePage - 1) * effectiveRowsPerPage;
  const visible = pagination ? filtered : filtered.slice(pageStart, pageStart + effectiveRowsPerPage);
  const totalRecords = pagination?.total ?? filtered.length;
  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(safePage - 2, pages - 4));
    const end = Math.min(pages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [pages, safePage]);

  return (
    <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
      <header className={`flex gap-2 bg-[#1E88E5] px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm sm:px-5 sm:py-4 sm:text-sm ${headerAction ? "flex-col items-start justify-between sm:flex-row sm:items-center" : "items-center justify-center text-center"}`}>
        <div className={headerAction ? "flex-1 text-center sm:text-left" : ""}>
          <div>{title}</div>
          {subtitle && <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wider text-blue-100 sm:text-[9px]">{subtitle}</p>}
        </div>
        {headerAction}
      </header>
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/20 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
          {filters.map((filter) => filter.render ? (
            <div key={filter.name} className={filter.className || "w-full sm:w-auto"}>{filter.render}</div>
          ) : (
            <label key={filter.name} className={`flex w-full flex-col ${filter.className || "sm:w-44"}`}>
              <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{filter.label}</span>
              {filter.type === "input" ? (
                <input
                  value={filter.value ?? ""}
                  onChange={(event) => {
                    filter.onChange?.(event);
                    setPage(1);
                  }}
                  placeholder={filter.placeholder || `Enter ${filter.label}`}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10"
                />
              ) : (
                <SearchableTableFilter
                  filter={filter}
                  onChange={(event) => {
                    filter.onChange?.(event);
                    if (pagination?.onPageChange) pagination.onPageChange(1);
                    else setPage(1);
                  }}
                />
              )}
            </label>
          ))}
          <label className="flex w-full flex-col sm:w-64">
            <span className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Search</span>
            <span className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => {
                if (searchConfig?.onChange) searchConfig.onChange(event);
                else setSearch(event.target.value);
                if (pagination?.onPageChange) pagination.onPageChange(1);
                else setPage(1);
              }}
              placeholder={searchConfig?.placeholder || "Search records..."}
              aria-label="Search table records"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-[#1E88E5] focus:ring-2 focus:ring-blue-500/10"
            />
            </span>
          </label>
          <label className="flex w-full flex-col sm:w-24">
            <span className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">Rows</span>
            <ReusableSelect
              size="compact"
              value={effectiveRowsPerPage}
              onChange={(event) => {
                const nextSize = Number(event.target.value);
                if (pagination?.onPageSizeChange) pagination.onPageSizeChange(nextSize);
                else setRowsPerPage(nextSize);
                if (pagination?.onPageChange) pagination.onPageChange(1);
                else setPage(1);
              }}
              className="cursor-pointer"
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </ReusableSelect>
          </label>
          {onResetFilters && (
            <button type="button" onClick={() => { onResetFilters(); setSearch(""); setPage(1); }} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-600 shadow-sm transition hover:bg-slate-50 sm:w-auto">
              <RotateCcw size={13} aria-hidden="true" /> Reset
            </button>
          )}
        </div>
        {onExport && (
          <button type="button" onClick={() => onExport(filtered)} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#121212] px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#252525] sm:w-auto">
            <Download size={12} aria-hidden="true" /> {exportLabel}
          </button>
        )}
      </div>
      <div className="border-b border-slate-100/50 bg-slate-50/10 px-4 py-3 text-xs font-semibold text-slate-500 sm:px-6 sm:py-4">
        Showing {pagination ? rows.length : filtered.length} of {pagination?.total ?? rows.length} {recordLabel}{countSuffix ? ` (${countSuffix})` : ""}
      </div>
      {error && (
        <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 sm:mx-4">{error}</div>
      )}
      <div className="flex-1 overflow-x-auto [-webkit-overflow-scrolling:touch]">
        <table className="w-max min-w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className={serialHeaderClassName || "sticky top-0 whitespace-nowrap bg-slate-50 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3"}>Sr. No.</th>
              {columns.map(({ key, label, headerClassName }) => (
                <th key={key} className={headerClassName || "sticky top-0 whitespace-nowrap bg-slate-50 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:px-3 sm:py-3"}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-10 text-center text-xs font-semibold text-slate-400">{loadingMessage}</td>
              </tr>
            ) : visible.length ? visible.map((row, index) => (
              <tr
                key={row.id ?? index}
                className={`${index % 2 === 0 ? "bg-white" : "bg-blue-50/40"} transition-colors hover:bg-blue-100/50`}
              >
                <td className={serialCellClassName || "whitespace-nowrap px-2 py-2 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-3"}>{pageStart + index + 1}</td>
                {columns.map(({ key, render, cellClassName }) => (
                  <td key={key} className={cellClassName || "whitespace-nowrap px-2 py-2 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-3"}>
                    {render ? render(row[key], row) : row[key] ?? "—"}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + 1} className="bg-slate-50/5 py-10 text-center text-xs font-semibold italic text-slate-400">{emptyMessage}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-col gap-3 border-t border-slate-100 bg-white p-3 text-[11px] font-bold text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <span className="text-center sm:text-left">Page {safePage} of {pages} — Showing {totalRecords ? pageStart + 1 : 0}-{Math.min(pageStart + effectiveRowsPerPage, totalRecords)} of {totalRecords} records</span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <button type="button" disabled={safePage === 1} onClick={() => pagination?.onPageChange ? pagination.onPageChange(Math.max(1, safePage - 1)) : setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
          {pageNumbers.map((number) => <button key={number} type="button" onClick={() => pagination?.onPageChange ? pagination.onPageChange(number) : setPage(number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold ${safePage === number ? "bg-[#1E88E5] text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{number}</button>)}
          <button type="button" disabled={safePage === pages} onClick={() => pagination?.onPageChange ? pagination.onPageChange(Math.min(pages, safePage + 1)) : setPage((current) => Math.min(pages, current + 1))} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
        </div>
      </footer>
    </section>
  );
}
