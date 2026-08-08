import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DepartmentNavbar from "./DepartmentNavbar";
import { departmentApi } from "./departmentApi";
import { getLocalDepartmentSchema } from "../../config/departmentSchemas";
import useAuth from "../../hooks/useAuth";
import { ACCESS_ROLES, hasMinimumRole, roleLabel } from "../../config/roleAccess";
import { getDepartmentMenu } from "../../config/departmentMenus";

const baseFallback = (department) => ({
  dashboard: {
    label: department.label,
    summary: [
      { label: "Total Work Items", value: 0, trend: "No data" },
      { label: "Open", value: 0, trend: "No data" },
      { label: "In Progress", value: 0, trend: "No data" },
      { label: "Completed", value: 0, trend: "No data" },
    ],
    recentActivity: [],
  },
  reports: [],
  policies: [],
  renewals: [],
  masters: [],
});

const fallback = (department) => {
  const data = baseFallback(department);
  if (department.slug !== "administration") return data;
  data.dashboard.label = "Administration";
  return data;
};
const defaultFilters = () => {
  const date = new Date();
  return {
    search: "", status: "All", product: "All", priority: "All", department: "All",
    month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
  };
};

const columns = {
  policies: ["department", "reportDate", "policyNumber", "insuredName", "product", "premium", "status"],
  renewals: ["department", "reportDate", "policyNumber", "insuredName", "renewalDate", "premium", "status"],
  reports: ["department", "policyNumber", "name", "product", "priority", "dueDate", "dueState", "assignee", "status"],
  masters: ["department", "name", "count", "updatedAt"],
};
const labels = {
  policyNumber: "Policy Number",
  reportDate: "Issue / Cancel Date",
  insuredName: "Insured Name",
  renewalDate: "Renewal Date",
  updatedAt: "Updated At",
  dueDate: "Due Date",
  dueState: "Due Status",
  assignee: "Assigned To",
  product: "Work Type",
};
const toneFor = (value) => {
  if (["Completed", "Approved", "Active", "On Track", "Upcoming"].includes(value)) return "bg-emerald-50 text-emerald-700";
  if (String(value || "").includes("Cancellation")) return "bg-rose-50 text-rose-700";
  if (["Rejected", "Expired", "Overdue", "Critical", "Cancelled"].includes(value)) return "bg-red-50 text-red-700";
  if (["Pending", "In Progress", "High", "Due"].includes(value)) return "bg-amber-50 text-amber-700";
  return "bg-blue-50 text-blue-700";
};
const tableColumns = (type, administration) => columns[type]
  .filter((key) => administration || key !== "department")
  .map((key) => ({
    key,
    label: labels[key] || key[0].toUpperCase() + key.slice(1),
    ...(["status", "priority", "dueState"].includes(key) ? {
      render: (value) => <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${toneFor(value)}`}>{value || "—"}</span>,
    } : {}),
  }));

export default function GenericDepartmentApp({ department, pages, Navbar = DepartmentNavbar }) {
  const location = useLocation();
  const { user } = useAuth();
  const initialData = useMemo(() => fallback(department), [department]);
  const localSchema = useMemo(() => getLocalDepartmentSchema(department.slug), [department.slug]);
  const [data, setData] = useState(initialData);
  const [schema, setSchema] = useState(localSchema);
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const requestedSection = location.pathname.split("/")[2] || "dashboard";
  const section = pages[requestedSection] ? requestedSection : "dashboard";
  const isAdministration = department.slug === "administration";
  const configuredMenu = useMemo(() => getDepartmentMenu(department.slug), [department.slug]);
  const pageLabel = useMemo(() => {
    if (section === "dashboard") return "Dashboard";
    const links = configuredMenu.flatMap((entry) => entry.children || [entry]);
    return links.find(({ path }) => path === section)?.label
      || section.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
  }, [configuredMenu, section]);

  useEffect(() => {
    let active = true;
    Promise.all([departmentApi.dashboard(department.slug), departmentApi.policies(department.slug), departmentApi.renewals(department.slug), departmentApi.masters(department.slug), departmentApi.schema(department.slug)])
      .then(([dashboard, policies, renewals, masters, nextSchema]) => { if (active) { setData((current) => ({ ...current, dashboard, policies, renewals, masters })); setSchema(nextSchema); } })
      .catch(() => { if (active) { setData(initialData); setSchema(localSchema); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [department.slug, initialData, localSchema, refreshKey]);

  useEffect(() => {
    let active = true;
    departmentApi.reports(department.slug, filters).then((reports) => { if (active) setData((current) => ({ ...current, reports })); }).catch(() => {});
    return () => { active = false; };
  }, [department.slug, filters, refreshKey]);

  const visibleReports = useMemo(() => data.reports.filter((row) => (!filters.search || Object.values(row).some((value) => String(value).toLowerCase().includes(filters.search.toLowerCase()))) && (filters.status === "All" || row.status === filters.status) && (filters.product === "All" || row.product === filters.product) && (filters.priority === "All" || row.priority === filters.priority) && (filters.department === "All" || row.department === filters.department)), [data.reports, filters]);
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const resetFilters = () => setFilters(defaultFilters());
  const createEntry = async (entry) => {
    const result = await departmentApi.createEntry(department.slug, entry);
    setRefreshKey((value) => value + 1);
    return result;
  };
  const updateStatus = async (id, status, note = "") => {
    await departmentApi.updateEntryStatus(department.slug, id, status, note);
    setRefreshKey((value) => value + 1);
  };
  const getHistory = (id) => departmentApi.entryHistory(department.slug, id);
  const Page = pages[section];
  const managerView = hasMinimumRole(user, ACCESS_ROLES.MANAGER);
  const pageProps = {
    dashboard: { data: data.dashboard, department },
    policies: { rows: data.policies, columns: tableColumns("policies", isAdministration) },
    renewals: { rows: data.renewals, columns: tableColumns("renewals", isAdministration) },
    "lapsed-policy": { rows: data.renewals, columns: tableColumns("renewals", isAdministration), lapsedOnly: true },
    reports: { rows: visibleReports, columns: tableColumns("reports", isAdministration), filterFields: schema.reportFilters, filters, onFilterChange: updateFilter, onResetFilters: resetFilters, onStatusChange: updateStatus, onHistory: getHistory },
    master: { rows: data.masters, columns: tableColumns("masters", isAdministration) },
    form: { department, fields: schema.formFields, onSubmit: createEntry },
  };

  if (section === "motor-entry") {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
        <Navbar department={department} />
        <main className="flex min-h-0 w-full flex-1 flex-col">
          <Page {...(pageProps[section] || pageProps.dashboard)} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <Navbar department={department} />
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-12">
        <header className="mb-5 flex flex-col items-start justify-between gap-2 sm:mb-7 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 sm:text-xs">Insurance Department Portal</p>
            <h1 className="mt-1 break-words text-xl font-black text-slate-900 sm:text-3xl">
              {department.label} · {pageLabel}
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {roleLabel(user)} · {managerView ? "Department team view" : "My assigned and created work"}
            </p>
          </div>
          {loading && <span className="shrink-0 text-xs font-semibold text-slate-400">Refreshing…</span>}
        </header>
        <Page {...(pageProps[section] || pageProps.dashboard)} />
      </main>
    </div>
  );
}
