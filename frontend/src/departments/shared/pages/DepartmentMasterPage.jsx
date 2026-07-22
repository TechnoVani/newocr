import { Database } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";

export default function DepartmentMasterPage({ rows, columns }) {
  return <ReusableTable title="Insurance Master Data" icon={Database} rows={rows} columns={columns}/>;
}
