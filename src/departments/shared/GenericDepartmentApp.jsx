import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import DepartmentNavbar from "./DepartmentNavbar";
import { departmentApi } from "./departmentApi";
import { getLocalDepartmentSchema } from "../../config/departmentSchemas";
import { DEPARTMENT_DEFINITIONS } from "../../config/departmentDefinitions";

const baseFallback = (department) => ({
  dashboard: {
    label: department.label,
    summary: [
      { label: "Active Policies", value: 284, trend: "+8%" },
      { label: "Premium Collected", value: "₹18.4L", trend: "+12%" },
      { label: "Pending Renewals", value: 27, trend: "This Month" },
      { label: "Open Actions", value: 12, trend: "Required" },
    ],
    recentActivity: [
      { id: 1, title: `${department.label} motor policy completed`, owner: "Department Admin", status: "Completed" },
      { id: 2, title: `${department.label} renewal report prepared`, owner: "Team Lead", status: "In Review" },
      { id: 3, title: `New health insurance entry assigned`, owner: "Insurance Desk", status: "Open" },
    ],
  },
  reports: [
    { id: 1, department: department.label, name: `${department.label} Daily Report`, period: "Today", records: 42, status: "Ready", product: "Motor" },
    { id: 2, department: department.label, name: `${department.label} Monthly Summary`, period: "July 2026", records: 318, status: "Ready", product: "Health" },
    { id: 3, department: department.label, name: `${department.label} Pending Report`, period: "Current", records: 17, status: "Processing", product: "Fire" },
  ],
  policies: [
    { id: 1, department: department.label, policyNumber: "NIB-MOT-260701", customer: "Aarav Sharma", product: "Motor Package", premium: "₹18,450", status: "Active" },
    { id: 2, department: department.label, policyNumber: "NIB-HLT-260702", customer: "Diya Verma", product: "Health Insurance", premium: "₹24,800", status: "Active" },
    { id: 3, department: department.label, policyNumber: "NIB-FIR-260703", customer: "Acme Industries", product: "Fire Insurance", premium: "₹42,600", status: "Pending" },
  ],
  renewals: [
    { id: 1, department: department.label, policyNumber: "NIB-MOT-250721", customer: "Vivaan Patel", renewalDate: "2026-07-24", premium: "₹16,900", status: "Due" },
    { id: 2, department: department.label, policyNumber: "NIB-HLT-250722", customer: "Ananya Singh", renewalDate: "2026-07-27", premium: "₹22,300", status: "Contacted" },
    { id: 3, department: department.label, policyNumber: "NIB-MAR-250723", customer: "Blue Ocean Traders", renewalDate: "2026-07-30", premium: "₹31,750", status: "Quoted" },
  ],
  masters: [
    { id: 1, department: department.label, name: `${department.label} Insurance Categories`, count: 8, updatedAt: "2026-07-20" },
    { id: 2, department: department.label, name: `${department.label} Status Types`, count: 6, updatedAt: "2026-07-20" },
    { id: 3, department: department.label, name: `${department.label} Assignment Rules`, count: 12, updatedAt: "2026-07-19" },
  ],
});

const fallback = (department) => {
  const data = baseFallback(department);
  if (department.slug !== "administration") return data;
  const departments = DEPARTMENT_DEFINITIONS.filter(({ slug }) => slug !== "administration");
  data.dashboard = { label: "Administration", summary: [{ label: "Departments", value: departments.length, trend: "All Access" }, { label: "Active Policies", value: 3864, trend: "+9%" }, { label: "Pending Renewals", value: 147, trend: "This Month" }, { label: "Open Claims", value: 38, trend: "Required" }], recentActivity: departments.slice(0, 6).map((item, index) => ({ id: index + 1, title: `${item.label} insurance report updated`, owner: `${item.label} Team`, status: index % 2 ? "In Review" : "Completed" })) };
  data.reports = departments.map((item, index) => ({ id: index + 1, department: item.label, name: `${item.label} Insurance Summary`, period: "July 2026", records: 120 + (index * 17), status: index % 4 ? "Ready" : "Processing", product: ["Motor", "Health", "Life", "Fire", "Marine"][index % 5] }));
  data.policies = departments.map((item, index) => ({ id: index + 1, department: item.label, policyNumber: `NIB-${String(index + 1).padStart(2, "0")}-260701`, customer: `${item.label} Customer`, product: "Motor Package", premium: `₹${(18450 + index * 750).toLocaleString("en-IN")}`, status: "Active" }));
  data.renewals = departments.map((item, index) => ({ id: index + 1, department: item.label, policyNumber: `NIB-REN-${String(index + 1).padStart(2, "0")}`, customer: `${item.label} Customer`, renewalDate: "2026-07-28", premium: `₹${(16900 + index * 500).toLocaleString("en-IN")}`, status: "Due" }));
  data.masters = departments.map((item, index) => ({ id: index + 1, department: item.label, name: `${item.label} Insurance Master`, count: 6 + index, updatedAt: "2026-07-20" }));
  return data;
};

const columns = {
  policies: ["department", "policyNumber", "customer", "product", "premium", "status"],
  renewals: ["department", "policyNumber", "customer", "renewalDate", "premium", "status"],
  reports: ["department", "name", "product", "period", "records", "status"],
  masters: ["department", "name", "count", "updatedAt"],
};
const labels = { policyNumber: "Policy Number", renewalDate: "Renewal Date", updatedAt: "Updated At" };
const tableColumns = (type, administration) => columns[type].filter((key) => administration || key !== "department").map((key) => ({ key, label: labels[key] || key[0].toUpperCase() + key.slice(1) }));

export default function GenericDepartmentApp({ department, pages, Navbar = DepartmentNavbar }) {
  const location = useLocation();
  const initialData = useMemo(() => fallback(department), [department]);
  const localSchema = useMemo(() => getLocalDepartmentSchema(department.slug), [department.slug]);
  const [data, setData] = useState(initialData);
  const [schema, setSchema] = useState(localSchema);
  const [filters, setFilters] = useState({ search: "", status: "All", product: "All", department: "All" });
  const [loading, setLoading] = useState(true);
  const section = location.pathname.split("/")[2] || "dashboard";
  const isAdministration = department.slug === "administration";

  useEffect(() => {
    let active = true;
    Promise.all([departmentApi.dashboard(department.slug), departmentApi.policies(department.slug), departmentApi.renewals(department.slug), departmentApi.masters(department.slug), departmentApi.schema(department.slug)])
      .then(([dashboard, policies, renewals, masters, nextSchema]) => { if (active) { setData((current) => ({ ...current, dashboard, policies, renewals, masters })); setSchema(nextSchema); } })
      .catch(() => { if (active) { setData(initialData); setSchema(localSchema); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [department.slug, initialData, localSchema]);

  useEffect(() => {
    let active = true;
    departmentApi.reports(department.slug, filters).then((reports) => { if (active) setData((current) => ({ ...current, reports })); }).catch(() => {});
    return () => { active = false; };
  }, [department.slug, filters]);

  const visibleReports = useMemo(() => data.reports.filter((row) => (!filters.search || Object.values(row).some((value) => String(value).toLowerCase().includes(filters.search.toLowerCase()))) && (filters.status === "All" || row.status === filters.status) && (filters.product === "All" || row.product === filters.product) && (filters.department === "All" || row.department === filters.department)), [data.reports, filters]);
  const updateFilter = (name, value) => setFilters((current) => ({ ...current, [name]: value }));
  const resetFilters = () => setFilters({ search: "", status: "All", product: "All", department: "All" });
  const Page = pages[section] || pages.dashboard;
  const pageProps = {
    dashboard: { data: data.dashboard },
    policies: { rows: data.policies, columns: tableColumns("policies", isAdministration) },
    renewals: { rows: data.renewals, columns: tableColumns("renewals", isAdministration) },
    reports: { rows: visibleReports, columns: tableColumns("reports", isAdministration), filterFields: schema.reportFilters, filters, onFilterChange: updateFilter, onResetFilters: resetFilters },
    master: { rows: data.masters, columns: tableColumns("masters", isAdministration) },
    form: { department, fields: schema.formFields, onSubmit: (entry) => departmentApi.createEntry(department.slug, entry) },
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <Navbar department={department} />
      <main className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-6 sm:py-8 lg:px-12">
        <header className="mb-5 flex flex-col items-start justify-between gap-2 sm:mb-7 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 sm:text-xs">Insurance Department Portal</p>
            <h1 className="mt-1 break-words text-xl font-black text-slate-900 sm:text-3xl">
              {department.label} · {section === "form" ? "Add Entry" : section[0].toUpperCase() + section.slice(1)}
            </h1>
          </div>
          {loading && <span className="shrink-0 text-xs font-semibold text-slate-400">Refreshing…</span>}
        </header>
        <Page {...(pageProps[section] || pageProps.dashboard)} />
      </main>
    </div>
  );
}
