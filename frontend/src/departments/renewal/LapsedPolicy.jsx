import RenewalPolicyTable from "./RenewalPolicyTable";

export default function LapsedPolicy({ rows }) {
  return <RenewalPolicyTable rows={rows} lapsedOnly />;
}
