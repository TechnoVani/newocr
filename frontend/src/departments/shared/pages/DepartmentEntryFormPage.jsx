import DependentInsuranceForm from "../../../components/reusable/DependentInsuranceForm";

export default function DepartmentEntryFormPage({ department, fields, onSubmit }) {
  const title = department.slug === "human-resources"
    ? "Create HR Process"
    : `${department.label} Insurance Workflow`;
  return <DependentInsuranceForm title={title} fields={fields} onSubmit={onSubmit}/>;
}
