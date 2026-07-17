import SetCountModel from "../models/setcount.model.js";

class SetCountService {
    /**
     * Create a new Set Count record
     */
    async createSetCount(data) {
        // Additional business validations can go here
        if (!data.pos_id) throw new Error("POS ID is required");
        if (!data.ref_id) throw new Error("Reference ID is required");
        if (!data.insured_name) throw new Error("Insured Name is required");

        const id = await SetCountModel.create(data);
        return {
            id,
            message: "Set Count record created successfully"
        };
    }

    /**
     * Get all Set Count records with optional search, sorting, and pagination
     */
    async getAllSetCounts(options) {
        return await SetCountModel.findAll(options);
    }

    /**
     * Get a single Set Count record by ID
     */
    async getSetCountById(id, userId) {
        const record = await SetCountModel.findById(id, userId);
        if (!record) {
            throw new Error("Policy record not found");
        }
        return record;
    }

    /**
     * Update an existing Set Count record
     */
    async updateSetCount(id, data, userId) {
        const existingRecord = await SetCountModel.findById(id, userId);
        if (!existingRecord) {
            throw new Error("Set Count record not found");
        }

        const commissionFields = [
            "irda_od", "irda_tp", "irda_net",
            "pos_od", "pos_tp", "pos_net"
        ];
        const commissionData = Object.fromEntries(
            commissionFields.map(field => [field, data[field]])
        );
        await SetCountModel.update(id, commissionData, userId);
        return {
            message: "Policy commission updated successfully"
        };
    }

    /**
     * Delete a Set Count record
     */
    async deleteSetCount(id, userId) {
        const existingRecord = await SetCountModel.findById(id, userId);
        if (!existingRecord) {
            throw new Error("Set Count record not found");
        }

        await SetCountModel.delete(id, userId);
        return {
            message: "Set Count record deleted successfully"
        };
    }
}

export default new SetCountService();
