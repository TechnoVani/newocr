import { useCallback, useEffect, useRef, useState } from "react";
import { Clock3, Download, FileSpreadsheet, Upload } from "lucide-react";
import { accountsApi } from "../../services/accountsApi";
import { downloadPayoutTemplate, parsePayoutWorkbook } from "./payoutGridExcel";
import { showApiError, showError, showSuccess, showValidation } from "../../../../utils/alert";

const maxMonth = new Date().toISOString().slice(0, 7);

export default function PayoutGridUpload() {
  const fileInput = useRef(null);
  const [companies, setCompanies] = useState([]);
  const [month, setMonth] = useState("");
  const [company, setCompany] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState([]);
  const [batches, setBatches] = useState([]);
  const [result, setResult] = useState(null);

  const loadBatches = useCallback(() => {
    accountsApi.payoutGridBatches()
      .then((rows) => setBatches(Array.isArray(rows) ? rows : []))
      .catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    accountsApi.companies()
      .then((rows) => setCompanies((Array.isArray(rows) ? rows : []).filter((item) => item.status !== "Inactive")))
      .catch((error) => showApiError(error, "Unable to load insurer companies."));
    loadBatches();
  }, [loadBatches]);

  const selectFile = async (selectedFile) => {
    setFile(selectedFile);
    setResult(null);
    setPreviewRows([]);
    if (!selectedFile) return;
    setParsing(true);
    try {
      const rows = await parsePayoutWorkbook(selectedFile);
      setPreviewRows(rows);
      showSuccess(`${rows.length} payout rows are ready to import.`, { key: "payout-parse-success" });
    } catch (error) {
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      showError(error.message || "Unable to read the selected workbook.", { key: "payout-parse-error" });
    } finally {
      setParsing(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) return showValidation("Select an Excel file.");
    setLoading(true);
    setResult(null);
    try {
      const rows = previewRows.length ? previewRows : await parsePayoutWorkbook(file);
      const response = await accountsApi.importPayoutGrid({
        company,
        month,
        fileName: file.name,
        rows,
      });
      setResult(response);
      showSuccess("Payout grid imported successfully.", { key: "payout-import-success" });
      setFile(null);
      setPreviewRows([]);
      if (fileInput.current) fileInput.current.value = "";
      loadBatches();
    } catch (error) {
      showApiError(error, "Unable to import payout grid.", { key: "payout-import-error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Accounts · Payout Grid</p>
          <h1 className="mt-1 text-3xl font-black text-slate-900">Upload payout Excel</h1>
          <p className="mt-2 text-sm text-slate-500">Import commission rules for one insurer and payout month.</p>
        </div>
        <button type="button" onClick={downloadPayoutTemplate} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 shadow-sm hover:bg-slate-50">
          <Download size={15} /> Download template
        </button>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <header className="flex items-center gap-3 bg-[#1E88E5] px-6 py-5 text-white">
          <FileSpreadsheet size={24} />
          <div>
            <h2 className="font-bold">Payout-grid import</h2>
            <p className="text-xs text-blue-100">XLSX, XLS, and CSV files are supported.</p>
          </div>
        </header>
        <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2">
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Month and year</span>
            <input type="month" min="2000-01" max={maxMonth} value={month} onChange={(event) => setMonth(event.target.value)} required className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="relative block pt-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Insurance company</span>
            <select value={company} onChange={(event) => setCompany(event.target.value)} required className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
              <option value="">Select insurer</option>
              {companies.map((item) => <option key={item.id} value={item.insurer}>{item.insurer}</option>)}
            </select>
          </label>
          <label className="relative block pt-2 sm:col-span-2">
            <span className="pointer-events-none absolute left-3 top-0 z-10 bg-white px-1 text-[9px] font-bold uppercase leading-none tracking-wider text-slate-500">Excel file</span>
            <input ref={fileInput} type="file" accept=".xlsx,.xls,.csv" onChange={(event) => selectFile(event.target.files?.[0] || null)} required className="rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-6 text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-blue-700" />
            {file && <span className="text-xs font-semibold text-emerald-600">{file.name} · {(file.size / 1024).toFixed(1)} KB</span>}
            {parsing && <span className="text-xs font-semibold text-blue-600">Reading workbook…</span>}
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={loading || parsing || !previewRows.length} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              <Upload size={17} /> {loading ? "Reading and importing…" : "Upload payout grid"}
            </button>
          </div>
        </form>
      </section>

      {previewRows.length > 0 && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-black text-slate-800">Workbook preview</h2>
              <p className="text-xs text-slate-500">{previewRows.length} recognized rows · showing the first 8</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">Validated</span>
          </header>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>{["#", "Business", "Category", "Classification", "Product", "RTO", "OD %", "TP %", "Net %"].map((heading) => <th key={heading} className="whitespace-nowrap px-3 py-3">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {previewRows.slice(0, 8).map((row, index) => (
                  <tr key={`${row.category}-${row.classification}-${index}`} className="hover:bg-blue-50/40">
                    <td className="px-3 py-3 text-slate-400">{index + 1}</td>
                    {[row.business_type, row.category, row.classification, row.product_type, row.rto, row.od_comm, row.tp_comm, row.net_comm].map((value, valueIndex) => <td key={valueIndex} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{value === "" || value === null || value === undefined ? "—" : value}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {result && (
        <section className="mt-6 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:grid-cols-2 lg:grid-cols-6">
          {[
            ["Company", result.company],
            ["Month", result.month],
            ["Rows inserted", result.rows_inserted],
            ["Previous rows replaced", result.rows_replaced],
            ["Empty rows skipped", result.rows_skipped],
            ["Duplicates skipped", result.duplicates_skipped],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
              <p className="mt-1 break-words text-sm font-black text-slate-800">{value}</p>
            </div>
          ))}
        </section>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <header className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <Clock3 size={17} className="text-blue-600" />
          <div>
            <h2 className="text-sm font-black text-slate-800">Recent payout batches</h2>
            <p className="text-[11px] text-slate-500">Latest company and month imports</p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>{["Company", "Month", "Rows", "Source file", "Uploaded"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.length ? batches.slice(0, 12).map((batch) => (
                <tr key={`${batch.company}-${batch.month}`}>
                  <td className="px-4 py-3 font-bold text-slate-800">{batch.company}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{batch.month}</td>
                  <td className="px-4 py-3 font-semibold text-slate-600">{batch.row_count}</td>
                  <td className="max-w-64 truncate px-4 py-3 text-slate-500" title={batch.source_file_name || ""}>{batch.source_file_name || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleString("en-IN") : "—"}</td>
                </tr>
              )) : <tr><td colSpan="5" className="px-4 py-8 text-center font-semibold text-slate-400">No payout grids uploaded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-5 text-xs leading-5 text-slate-500">
        Re-uploading the same insurer and month replaces that complete batch. Download the template for supported columns and applicability-rule formats.
      </p>
    </main>
  );
}
