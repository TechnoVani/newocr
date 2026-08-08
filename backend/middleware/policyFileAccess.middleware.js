import PoliciesMotorModel from "../models/operations/policy-workspace/policiesMotor.model.js";
import { getPolicyReadScope } from "../utils/dataScope.js";
import { errorResponse } from "../utils/response.js";

/**
 * Authorize access to:
 * /uploads/<financial-year>/<month>/<policy-number>/<file>
 *
 * Files return 404 for non-owners so another user cannot probe whether a
 * policy number or document exists.
 */
const policyFileAccessMiddleware = async (req, res, next) => {
    try {
        const segments = req.path.split("/").filter(Boolean);
        if (segments.length !== 4 || segments.includes("temp")) {
            return errorResponse(res, "File not found", null, 404);
        }

        const policyFolder = segments[2];
        const ownsFolder = await PoliciesMotorModel.userOwnsPolicyFolder(
            getPolicyReadScope(req.user),
            policyFolder
        );

        if (!ownsFolder) {
            return errorResponse(res, "File not found", null, 404);
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default policyFileAccessMiddleware;
