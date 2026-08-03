import db from "../../config/database.js";

class PosManagementModel {
    static async getMasters(insurer = "") {
        const params = [];
        let branchWhere = "WHERE status = 'Active'";
        if (insurer) {
            branchWhere += " AND insurer = ?";
            params.push(insurer);
        }
        const [[companies], [branches]] = await Promise.all([
            db.query(
                `SELECT id, insurer, type, link
                 FROM insurance_company
                 WHERE status = 'Active'
                 ORDER BY insurer ASC`
            ),
            db.query(
                `SELECT id, insurer, gst_no, address, city, state, pin_code
                 FROM insurance_branch
                 ${branchWhere}
                 ORDER BY insurer ASC, city ASC, id ASC`,
                params
            )
        ]);
        return { companies, branches };
    }
}

export default PosManagementModel;
