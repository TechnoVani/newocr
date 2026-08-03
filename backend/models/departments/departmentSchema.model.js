import {
  getDepartmentWorkflow,
  STATUS_TRANSITIONS,
  WORKFLOW_STATUSES,
} from "./departmentWorkflowConfig.js";

const priorityField = {
  name: "priority",
  label: "Priority",
  type: "select",
  options: ["Low", "Normal", "High", "Critical"],
  defaultValue: "Normal",
};

const commonTail = [
  priorityField,
  { name: "dueDate", label: "Due Date", type: "date" },
  { name: "description", label: "Description / Notes", type: "textarea", required: true },
];

class DepartmentSchemaModel {
  static get(department) {
    const workflow = getDepartmentWorkflow(department);
    let baseFields;
    if (department === "human-resources") {
      baseFields = [
        { name: "employeeName", label: "Employee / Candidate Name", type: "text", required: true },
        { name: "policyNumber", label: "Employee Code (required for leave/exit)", type: "text" },
      ];
    } else {
      baseFields = [{
        name: "policyNumber",
        label: workflow.policyRequired === false ? "Related Policy Number (optional)" : "Policy Number",
        type: "text",
        required: workflow.policyRequired !== false,
      }];
    }

    const fields = [...baseFields, ...workflow.fields, ...commonTail];
    return {
      department,
      formFields: fields,
      workTypeField: workflow.workTypeField,
      statuses: WORKFLOW_STATUSES,
      statusTransitions: STATUS_TRANSITIONS,
      reportFilters: [
        { name: "search", label: "Search", type: "search" },
        { name: "status", label: "Status", type: "select", options: ["All", ...WORKFLOW_STATUSES] },
        {
          name: "product",
          label: "Work Type",
          type: "select",
          options: ["All", ...(workflow.fields.find(({ name }) => name === workflow.workTypeField)?.options || [])],
        },
        { name: "priority", label: "Priority", type: "select", options: ["All", "Low", "Normal", "High", "Critical"] },
        ...(department === "administration" ? [{
          name: "department",
          label: "Department",
          type: "select",
          options: ["All", ...(workflow.fields.find(({ name }) => name === "selectedDepartment")?.options || [])],
        }] : []),
      ],
    };
  }
}

export default DepartmentSchemaModel;
