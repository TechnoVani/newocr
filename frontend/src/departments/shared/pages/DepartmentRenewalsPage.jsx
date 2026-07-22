import { RefreshCw } from "lucide-react";
import ReusableTable from "../../../components/reusable/ReusableTable";

export default function DepartmentRenewalsPage({ rows, columns }) {
  return <ReusableTable title="Upcoming Renewals" icon={RefreshCw} rows={rows} columns={columns}/>;
}
