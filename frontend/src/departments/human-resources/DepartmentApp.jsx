import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import { roleLabel } from "../../config/roleAccess";
import Navbar from "./Navbar";
import Dashboard from "./Dashboard";
import Employees from "./Policies";
import Organization from "./Organization";
import Documents from "./Documents";
import Payroll from "./Payroll";
import Leave from "./Leave";
import Lifecycle from "./Lifecycle";
import Attendance from "./Attendance";
import Reports from "./Reports";
import Profile from "./Profile";
import WorkforceSetup from "./WorkforceSetup";
import Performance from "./Performance";
import { department } from "./department";
import { hrApi } from "./hrApi";

const pages = {
  employees: Employees,
  profiles: Profile,
  organization: Organization,
  documents: Documents,
  payroll: Payroll,
  attendance: Attendance,
  reports: Reports,
  setup: WorkforceSetup,
  performance: Performance,
  leave: Leave,
  lifecycle: Lifecycle,
};
const pageTitles = {
  dashboard: "Dashboard",
  employees: "Employees",
  profiles: "Employee Profiles",
  organization: "Departments & Designations",
  documents: "Letters",
  payroll: "Payroll",
  attendance: "Attendance",
  performance: "Performance",
  reports: "HR Reports",
  setup: "Workforce Setup",
  leave: "Leave Management",
  lifecycle: "Employee Lifecycle",
};

export default function HumanResourcesDepartmentApp() {
  const location = useLocation();
  const { user } = useAuth();
  const requestedSection = location.pathname.split("/")[2] || "dashboard";
  const section = pages[requestedSection] ? requestedSection : "dashboard";
  const Page = pages[section] || Dashboard;
  const [options, setOptions] = useState({ departments: [], designations: [], employees: [], leaveTypes: [] });
  const [overview, setOverview] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([hrApi.options(), hrApi.overview()])
      .then(([nextOptions, nextOverview]) => {
        if (active) {
          setOptions(nextOptions || {});
          setOverview(nextOverview || {});
        }
      })
      .catch(requestError => {
        if (active) setError(requestError.response?.data?.message || "Unable to load the HR module API. Restart or deploy the updated backend.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const refresh = () => {
    setLoading(true);
    setError("");
    setRefreshKey(value => value + 1);
  };
  const title = pageTitles[section];
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <Navbar department={department} />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-10">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Human Resources Management System</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">{title}</h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">{roleLabel(user)} · Employee lifecycle and workforce operations</p>
          </div>
          {loading && <span className="text-xs font-semibold text-slate-400">Refreshing…</span>}
        </header>
        {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
        <Page options={options} overview={overview} refresh={refresh} />
      </main>
    </div>
  );
}
