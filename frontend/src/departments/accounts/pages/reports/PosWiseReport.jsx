import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleDollarSign, IndianRupee, TrendingUp, Users } from "lucide-react";
import * as XLSX from "xlsx";
import ReusableTable from "../../../../components/reusable/ReusableTable";
import MonthYearPicker from "../../../../pages/reusable/MonthYearPicker";
import { accountsApi } from "../../services/accountsApi";

const currentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const currency = value => new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
}).format(Number(value) || 0);

const emptyReport = {
  rows: [],
  filter_options: {
    pos: [],
    references: [],
  },
  summary: {
    pos_count: 0,
    policy_count: 0,
    cancelled_count: 0,
    total_od: 0,
    total_tp: 0,
    net_premium: 0,
    gross_premium: 0,
    od_income: 0,
    tp_income: 0,
    net_income: 0,
    total_income: 0,
    verified_count: 0,
    paid_count: 0,
  },
};

const columns = [
  {
    key: "pos_name",
    label: "POS Name",
    render: (_, row) => (
      <div>
        <p className="font-bold text-slate-800">{row.pos_name}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-slate-400">{row.pos_code}</p>
      </div>
    ),
  },
  { key: "policy_count", label: "Total Count" },
  {
    key: "verified_count",
    label: "Verified Policies",
    render: (value, row) => (
      <span className="font-bold text-emerald-700">
        {value}/{row.policy_count}
      </span>
    ),
  },
  { key: "total_od", label: "OD Premium", render: currency },
  { key: "total_tp", label: "TP Premium", render: currency },
  { key: "net_premium", label: "Net Premium", render: currency },
  { key: "gross_premium", label: "Total Payable Premium", render: currency },
  { key: "od_income", label: "POS OD Income", render: currency },
  { key: "tp_income", label: "POS TP Income", render: currency },
  { key: "net_income", label: "POS Net Income", render: currency },
  { key: "total_income", label: "Total POS Income", render: value => <span className="font-black text-blue-700">{currency(value)}</span> },
];

function SummaryCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black text-slate-900">{value}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
        </div>
        <span className={`rounded-xl p-3 ${tone}`}><Icon size={20} /></span>
      </div>
    </article>
  );
}

export default function PosWiseReport() {
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(emptyReport);
  const [search, setSearch] = useState("");
  const [posId, setPosId] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReferences, setShowReferences] = useState(false);

  useEffect(() => {
    let active = true;
    // A changed reporting month starts a new Accounts report request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    accountsApi.posWiseReport({
      month,
      ...(posId ? { posId } : {}),
      ...(referenceId ? { referenceId } : {}),
    })
      .then(data => { if (active) setReport(data || emptyReport); })
      .catch(requestError => {
        if (!active) return;
        setReport(emptyReport);
        const responseMessage = requestError.response?.data &&
          typeof requestError.response.data === "object"
          ? requestError.response.data.message
          : "";
        const message = responseMessage ||
          (requestError.response?.status === 404
            ? "The POS-wise report API is not loaded. Restart or deploy the matching backend."
            : requestError.code === "ERR_NETWORK"
              ? "Cannot reach the backend. Check that the API server is running."
              : "Unable to load the POS-wise report.");
        setError(message);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [month, posId, referenceId]);

  const referenceOptions = useMemo(() => {
    const options = report.filter_options?.references || [];
    return posId ? options.filter(option => String(option.pos_id) === String(posId)) : [];
  }, [posId, report.filter_options?.references]);

  const referencesByPos = useMemo(() => {
    const grouped = new Map();
    (report.filter_options?.references || [])
      .filter(option => !referenceId || String(option.value) === String(referenceId))
      .forEach(option => {
        const values = grouped.get(String(option.pos_id)) || [];
        values.push(option);
        grouped.set(String(option.pos_id), values);
      });
    return grouped;
  }, [referenceId, report.filter_options?.references]);

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (report.rows || []).map(row => ({
      ...row,
      reference_details: referencesByPos.get(String(row.pos_id)) || [],
    })).filter(row => {
      const referenceSearchValues = showReferences
        ? row.reference_details.flatMap(reference => [reference.name, reference.mobile])
        : [];
      const matchesSearch = !term || [row.pos_name, row.pos_code, row.email, ...referenceSearchValues]
        .some(value => String(value || "").toLowerCase().includes(term));
      return matchesSearch;
    });
  }, [referencesByPos, report.rows, search, showReferences]);

  const reportColumns = useMemo(() => {
    if (!showReferences) return columns;
    const referenceColumn = {
      key: "reference_details",
      label: "Reference Name & Mobile Number",
      searchValue: row => (row.reference_details || [])
        .map(reference => `${reference.name || ""} ${reference.mobile || ""}`)
        .join(" "),
      render: references => references?.length ? (
        <div className="space-y-1.5">
          {references.map(reference => (
            <div key={reference.value}>
              <p className="font-bold text-slate-800">{reference.name || "Unnamed Reference"}</p>
              <p className="text-[10px] font-semibold text-slate-400">{reference.mobile || "No mobile number"}</p>
            </div>
          ))}
        </div>
      ) : "—",
    };
    return [columns[0], referenceColumn, ...columns.slice(1)];
  }, [showReferences]);

  const summary = useMemo(() => visibleRows.reduce((result, row) => {
    result.pos_count += 1;
    result.policy_count += Number(row.policy_count) || 0;
    result.cancelled_count += Number(row.cancelled_count) || 0;
    result.total_od += Number(row.total_od) || 0;
    result.total_tp += Number(row.total_tp) || 0;
    result.net_premium += Number(row.net_premium) || 0;
    result.gross_premium += Number(row.gross_premium) || 0;
    result.od_income += Number(row.od_income) || 0;
    result.tp_income += Number(row.tp_income) || 0;
    result.net_income += Number(row.net_income) || 0;
    result.total_income += Number(row.total_income) || 0;
    result.verified_count += Number(row.verified_count) || 0;
    return result;
  }, {
    pos_count: 0,
    policy_count: 0,
    cancelled_count: 0,
    total_od: 0,
    total_tp: 0,
    net_premium: 0,
    gross_premium: 0,
    od_income: 0,
    tp_income: 0,
    net_income: 0,
    total_income: 0,
    verified_count: 0,
  }), [visibleRows]);

  const exportExcel = () => {
    if (!visibleRows.length) return;
    const rows = visibleRows.map(row => ({
      "POS Code": row.pos_code,
      "POS Name": row.pos_name,
      Email: row.email,
      Status: row.pos_status,
      ...(showReferences ? {
        "Reference Name & Mobile Number": (row.reference_details || [])
          .map(reference => reference.mobile
            ? `${reference.name} (${reference.mobile})`
            : reference.name)
          .join(", "),
      } : {}),
      "Total Count": row.policy_count,
      "Verified Policies": row.verified_count,
      Paid: row.paid_count,
      "Own Damage (OD) Premium": row.total_od,
      "Third-Party (TP) Premium": row.total_tp,
      "Net Premium": row.net_premium,
      "Total Payable Premium": row.gross_premium,
      "OD Income (POS %)": row.od_income,
      "TP Income (POS %)": row.tp_income,
      "Net Income (POS %)": row.net_income,
      "Total POS Income": row.total_income,
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!cols"] = Object.keys(rows[0]).map(key => ({ wch: Math.min(32, Math.max(13, key.length + 2)) }));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "POS Wise");
    XLSX.writeFile(book, `Accounts_POS_Wise_${month}.xlsx`);
  };

  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-3 py-5 sm:px-6 sm:py-8">
      <header className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-600">Accounts Income Report</p>
        <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">POS-wise Income Report</h1>
        <p className="mt-1 text-sm font-medium text-slate-500">Policy premiums and income calculated from the configured POS percentages.</p>
      </header>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total POS" value={summary.pos_count} detail={`${summary.policy_count} total entries · ${summary.cancelled_count} cancelled`} icon={Users} tone="bg-blue-50 text-blue-600" />
        <SummaryCard label="Total OD Premium" value={currency(summary.total_od)} detail="Motor entries plus recovery" icon={IndianRupee} tone="bg-cyan-50 text-cyan-600" />
        <SummaryCard label="Total TP Premium" value={currency(summary.total_tp)} detail="Motor entries plus recovery" icon={IndianRupee} tone="bg-violet-50 text-violet-600" />
        <SummaryCard label="Total Net Premium" value={currency(summary.net_premium)} detail="Motor entries plus recovery" icon={IndianRupee} tone="bg-emerald-50 text-emerald-600" />
        <SummaryCard label="Gross Premium" value={currency(summary.gross_premium)} detail="Motor entries plus recovery" icon={IndianRupee} tone="bg-amber-50 text-amber-600" />
        <SummaryCard label="OD Income" value={currency(summary.od_income)} detail="OD premium × POS OD %" icon={CircleDollarSign} tone="bg-cyan-50 text-cyan-600" />
        <SummaryCard label="TP Income" value={currency(summary.tp_income)} detail="TP premium × POS TP %" icon={CircleDollarSign} tone="bg-violet-50 text-violet-600" />
        <SummaryCard label="Net Income" value={currency(summary.net_income)} detail="Net premium × POS Net %" icon={CircleDollarSign} tone="bg-indigo-50 text-indigo-600" />
        <SummaryCard label="Total POS Income" value={currency(summary.total_income)} detail="OD Income + TP Income + Net Income" icon={TrendingUp} tone="bg-blue-50 text-blue-700" />
      </section>

      <ReusableTable
        title="POS-wise Income Statement"
        subtitle={`${month} · ${visibleRows.length} partners`}
        rows={visibleRows}
        columns={reportColumns}
        loading={loading}
        error={error}
        pageSize={10}
        pageSizeOptions={[10, 20, 50, 100]}
        showSerialNumber={false}
        filters={[
          {
            name: "month",
            render: (
              <MonthYearPicker
                label="Issue Month"
                month={Number(month.slice(5, 7))}
                year={Number(month.slice(0, 4))}
                clearable={false}
                onChange={(nextMonth, nextYear) => {
                  setMonth(`${nextYear}-${String(nextMonth).padStart(2, "0")}`);
                }}
              />
            ),
          },
          {
            name: "posId",
            label: "POS",
            value: posId,
            options: report.filter_options?.pos || [],
            placeholder: "Select POS",
            clearable: true,
            onChange: event => {
              setPosId(event.target.value);
              setReferenceId("");
            },
          },
          ...(showReferences ? [{
            name: "referenceId",
            label: "POS Reference",
            value: referenceId,
            options: referenceOptions,
            placeholder: posId ? "Select reference" : "Select POS first",
            clearable: true,
            onChange: event => setReferenceId(event.target.value),
          }] : []),
          {
            name: "showReferences",
            render: (
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm">
                <input
                  type="checkbox"
                  checked={showReferences}
                  onChange={event => {
                    setShowReferences(event.target.checked);
                    if (!event.target.checked) setReferenceId("");
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Show POS References
              </label>
            ),
          },
        ]}
        searchConfig={{
          value: search,
          onChange: event => setSearch(event.target.value),
          placeholder: showReferences
            ? "Search POS, reference name, mobile, or email"
            : "Search POS name, code, or email",
        }}
        onResetFilters={() => {
          setSearch("");
          setPosId("");
          setReferenceId("");
          setShowReferences(false);
        }}
        onExport={exportExcel}
        emptyMessage="No POS-linked policies were found for the selected month."
      />

      <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <BadgeCheck size={14} className="text-emerald-500" />
        Total POS Income = OD Income + TP Income + Net Income. All income values use the configured POS percentages only.
      </div>
    </main>
  );
}
