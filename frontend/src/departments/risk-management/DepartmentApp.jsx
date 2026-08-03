import StandardDepartmentApp from "../shared/StandardDepartmentApp";
import Navbar from "./Navbar";
import { department } from "./department";

export default function RiskManagementDepartmentApp() {
  return <StandardDepartmentApp department={department} Navbar={Navbar} />;
}
