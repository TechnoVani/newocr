import DepartmentSchemaModel from "./departmentSchema.model.js";

class DepartmentEntryModel {
    static create(department, payload, user) {
        const schema = DepartmentSchemaModel.get(department);
        const missing = schema.formFields.filter(field => field.required && !String(payload[field.name] || "").trim());
        if (missing.length) {
            const error = new Error(`Required fields missing: ${missing.map(field => field.label).join(", ")}`);
            error.statusCode = 400;
            throw error;
        }
        return {
            id: `DEP-${Date.now()}`,
            department,
            ...payload,
            createdBy: user.id,
            createdAt: new Date().toISOString()
        };
    }
}

export default DepartmentEntryModel;
