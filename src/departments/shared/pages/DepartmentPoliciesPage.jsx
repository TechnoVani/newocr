import { Files } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";

export default function DepartmentPoliciesPage({ rows, columns }) {
  return <ReusableTable title="Insurance Policies" icon={Files} rows={rows} columns={columns}/>;
}
