import DependentInsuranceForm from "../../../components/reusable/DependentInsuranceForm";

export default function DepartmentEntryFormPage({ department, fields, onSubmit }) {
  return <DependentInsuranceForm title={`${department.label} Insurance Form`} fields={fields} onSubmit={onSubmit}/>;
}
