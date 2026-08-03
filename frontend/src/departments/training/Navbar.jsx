import { getDepartmentMenu } from "../../config/departmentMenus";
import DepartmentNavbar from "../shared/DepartmentNavbar";
import { department } from "./department";

export default function TrainingNavbar() {
  return <DepartmentNavbar department={department} items={getDepartmentMenu(department.slug)} />;
}
