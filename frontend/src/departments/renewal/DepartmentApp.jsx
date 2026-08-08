import GenericDepartmentApp from "../shared/GenericDepartmentApp";
import Dashboard from "./Dashboard";
import Policies from "./Policies";
import Renewals from "./Renewals";
import LapsedPolicy from "./LapsedPolicy";
import Reports from "./Reports";
import MotorEntry from "../../features/policy-workspace/pages/MotorEntry";
import Navbar from "./Navbar";
import { department } from "./department";

const pages = Object.freeze({
  dashboard: Dashboard,
  policies: Policies,
  renewals: Renewals,
  "lapsed-policy": LapsedPolicy,
  reports: Reports,
  "motor-entry": MotorEntry
});

export default function RenewalDepartmentApp() {
  return <GenericDepartmentApp department={department} pages={pages} Navbar={Navbar} />;
}
