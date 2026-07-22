import ReusableTable from "../../../components/reusable/ReusableTable";

export default function DepartmentReportsPage({ rows, columns, filterFields, filters, onFilterChange, onResetFilters }) {
  const tableFilters = filterFields
    .filter(({ type }) => type !== "search")
    .map((field) => ({
      ...field,
      value: filters[field.name],
      onChange: (event) => onFilterChange(field.name, event.target.value),
    }));

  return (
    <ReusableTable title="Dynamic Insurance Reports" rows={rows} columns={columns} filters={tableFilters} onResetFilters={onResetFilters}/>
  );
}
