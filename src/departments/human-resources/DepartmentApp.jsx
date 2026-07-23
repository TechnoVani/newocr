import GenericDepartmentApp from "../shared/GenericDepartmentApp";
import Dashboard from "./Dashboard";
import Policies from "./Policies";
import Renewals from "./Renewals";
import Reports from "./Reports";
import Master from "./Master";
import EntryForm from "./EntryForm";
import Navbar from "./Navbar";
import { department } from "./department";

const pages = Object.freeze({ dashboard: Dashboard, policies: Policies, renewals: Renewals, reports: Reports, master: Master, form: EntryForm });
export default function HumanResourcesDepartmentApp() { return <GenericDepartmentApp department={department} pages={pages} Navbar={Navbar}/>; }
