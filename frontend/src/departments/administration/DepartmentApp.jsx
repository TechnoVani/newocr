import GenericDepartmentApp from "../shared/GenericDepartmentApp";
import Dashboard, { EmployeeBusinessReport, PosBusinessReport, PosMonthReport } from "./Dashboard";
import Policies from "./Policies";
import Renewals from "./Renewals";
import Reports from "./Reports";
import Master from "./Master";
import EntryForm from "./EntryForm";
import Navbar from "./Navbar";
import { department } from "./department";

const pages = Object.freeze({
  dashboard: Dashboard,
  "pos-business-report": PosBusinessReport,
  "pos-month-report": PosMonthReport,
  "employee-business-report": EmployeeBusinessReport,
  policies: Policies,
  renewals: Renewals,
  reports: Reports,
  master: Master,
  form: EntryForm,
});
export default function AdministrationDepartmentApp() { return <GenericDepartmentApp department={department} pages={pages} Navbar={Navbar}/>; }
