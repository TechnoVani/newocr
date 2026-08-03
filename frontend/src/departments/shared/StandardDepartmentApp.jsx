import GenericDepartmentApp from "./GenericDepartmentApp";
import DepartmentNavbar from "./DepartmentNavbar";
import DepartmentDashboardPage from "./pages/DepartmentDashboardPage";
import DepartmentEntryFormPage from "./pages/DepartmentEntryFormPage";
import DepartmentMasterPage from "./pages/DepartmentMasterPage";
import DepartmentPoliciesPage from "./pages/DepartmentPoliciesPage";
import DepartmentRenewalsPage from "./pages/DepartmentRenewalsPage";
import DepartmentReportsPage from "./pages/DepartmentReportsPage";

const pages = Object.freeze({
  dashboard: DepartmentDashboardPage,
  policies: DepartmentPoliciesPage,
  renewals: DepartmentRenewalsPage,
  reports: DepartmentReportsPage,
  master: DepartmentMasterPage,
  form: DepartmentEntryFormPage,
});

export default function StandardDepartmentApp({ department, Navbar = DepartmentNavbar }) {
  return <GenericDepartmentApp department={department} pages={pages} Navbar={Navbar}/>;
}
