import StandardDepartmentApp from "../shared/StandardDepartmentApp";
import Navbar from "./Navbar";
import { department } from "./department";

export default function AuditDepartmentApp() {
  return <StandardDepartmentApp department={department} Navbar={Navbar} />;
}
