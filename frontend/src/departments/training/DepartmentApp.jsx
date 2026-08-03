import StandardDepartmentApp from "../shared/StandardDepartmentApp";
import Navbar from "./Navbar";
import { department } from "./department";

export default function TrainingDepartmentApp() {
  return <StandardDepartmentApp department={department} Navbar={Navbar} />;
}
