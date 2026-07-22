import SetCommModel from "../../models/ops/setcomm.model.js";

class SetCommService {
    /**
     * Create a new set commission record.
     */
    async createSetComm(data) {
        // Additional business validations can go here
        if (!data.pos_id) throw new Error("POS ID is required");
        if (!data.ref_id) throw new Error("Reference ID is required");
        if (!data.insured_name) throw new Error("Insured Name is required");

        const id = await SetCommModel.create(data);
        return {
            id,
            message: "Set commission record created successfully"
        };
    }

    /**
     * Get policy commission rows with optional filters and pagination.
     */
    async getAllSetCommissions(options) {
        return await SetCommModel.findAll(options);
    }

    async getFilterOptions(readScope) {
        const [posOptions, insurers] = await Promise.all([
            SetCommModel.getDistinctPosOptions(readScope),
            SetCommModel.getDistinctInsurers(readScope)
        ]);
        return { posOptions, insurers };
    }

    /**
     * Get a single policy commission row by ID.
     */
    async getSetCommById(id, readScope) {
        const record = await SetCommModel.findById(id, readScope);
        if (!record) {
            throw new Error("Policy record not found");
        }
        return record;
    }

    /**
     * Update an existing policy commission row.
     */
    async updateSetComm(id, data, readScope) {
        const existingRecord = await SetCommModel.findById(id, readScope);
        if (!existingRecord) {
            throw new Error("Set commission record not found");
        }

        const commissionFields = [
            "irda_od", "irda_tp", "irda_net",
            "pos_od", "pos_tp", "pos_net"
        ];
        const commissionData = Object.fromEntries(
            commissionFields.map(field => [field, data[field]])
        );
        await SetCommModel.update(id, commissionData, readScope);
        return {
            message: "Policy commission updated successfully"
        };
    }

    /**
     * Delete a policy commission row.
     */
    async deleteSetComm(id, readScope) {
        const existingRecord = await SetCommModel.findById(id, readScope);
        if (!existingRecord) {
            throw new Error("Set commission record not found");
        }

        await SetCommModel.delete(id, readScope);
        return {
            message: "Set commission record deleted successfully"
        };
    }
}

export default new SetCommService();
