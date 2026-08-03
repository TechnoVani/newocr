import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import ReusableTable from "../../components/reusable/ReusableTable";
import ReusableSelect from "../../components/reusable/ReusableSelect";
import { departmentApi } from "../shared/departmentApi";

const statusTone = (value) => {
  if (value === "Closed" || value === "Renewed") return "bg-emerald-50 text-emerald-700";
  if (value === "Lost" || value === "Not Interested") return "bg-red-50 text-red-700";
  if (value === "Scheduled" || value === "Not Reachable") return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
};

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    departmentApi.followups("renewal")
      .then((data) => { if (active) setRows(data); })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || "Unable to load follow-up report.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => status === "All" ? rows : rows.filter((row) => row.status === status), [rows, status]);
  const columns = [
    { key: "policyNumber", label: "Policy Number" },
    { key: "insuredName", label: "Insured Name" },
    { key: "renewalDate", label: "Renewal Date" },
    { key: "followupDate", label: "Follow-up Date" },
    { key: "nextFollowupDate", label: "Next Follow-up" },
    { key: "contactMode", label: "Mode" },
    { key: "disposition", label: "Disposition", render: (value) => <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusTone(value)}`}>{value || "—"}</span> },
    { key: "status", label: "Status", render: (value) => <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${statusTone(value)}`}>{value || "—"}</span> },
    { key: "remarks", label: "Remarks", cellClassName: "max-w-sm whitespace-normal px-2 py-2 text-[10px] font-semibold text-slate-700 sm:px-3 sm:py-3" },
    { key: "createdBy", label: "Created By" },
    { key: "createdAt", label: "Created At" },
  ];

  return (
    <ReusableTable
      title="Follow-up Report"
      icon={ClipboardCheck}
      rows={filtered}
      columns={columns}
      loading={loading}
      error={error}
      pageSize={20}
      pageSizeOptions={[20, 50, 100]}
      filters={[{
        name: "status",
        label: "Status",
        render: <ReusableSelect value={status} onChange={(event) => setStatus(event.target.value)}>
          {["All", "Open", "Scheduled", "Closed"].map((value) => <option key={value}>{value}</option>)}
        </ReusableSelect>,
      }]}
      emptyMessage="No follow-up records found."
    />
  );
}
