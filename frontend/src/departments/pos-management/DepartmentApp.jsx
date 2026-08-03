import { useLocation } from "react-router-dom";
import MotorEntry from "./pages/MotorEntry";
import Reference from "./pages/Reference";
import PosDashboard from "./PosDashboard";
import PosPolicyReport from "./PosPolicyReport";
import PosReports from "./PosReports";
import PosPayout from "./PosPayout";
import PosNavbar from "./PosNavbar";
import { department } from "./department";

export default function PosManagementDepartmentApp() {
  const requestedSection = useLocation().pathname.split("/")[2] || "dashboard";
  const pages = {
    dashboard: <PosDashboard/>,
    policies: <PosPolicyReport/>,
    renewals: <PosPolicyReport renewal/>,
    reports: <PosReports/>,
    payout: <PosPayout/>,
    references: <Reference portalLabel="POS Management" reportTitle="POS Reference Report"/>,
    "motor-entry": <MotorEntry/>,
  };
  const section = pages[requestedSection] ? requestedSection : "dashboard";
  const pageTitles = {
    dashboard: "Dashboard",
    policies: "Policies",
    renewals: "Upcoming Policy",
    reports: "Reports",
    payout: "Payout",
    references: "References",
    "motor-entry": "Motor Entry",
  };
  return <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
    <PosNavbar department={department}/>
    <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-4 sm:px-6 sm:py-8 lg:px-12">
      <header className="mb-5 sm:mb-7">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 sm:text-xs">Insurance Department Portal</p>
        <h1 className="mt-1 text-xl font-black text-slate-900 sm:text-3xl">{department.label} · {pageTitles[section]}</h1>
      </header>
      {pages[section] || pages.dashboard}
    </main>
  </div>;
}
