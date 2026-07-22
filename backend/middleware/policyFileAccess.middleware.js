import PolicyModel from "../models/ops/policy.model.js";
import { getPolicyReadScope } from "../utils/dataScope.js";

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
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        const policyFolder = segments[2];
        const ownsFolder = await PolicyModel.userOwnsPolicyFolder(
            getPolicyReadScope(req.user),
            policyFolder
        );

        if (!ownsFolder) {
            return res.status(404).json({
                success: false,
                message: "File not found"
            });
        }

        next();
    } catch (error) {
        next(error);
    }
};

export default policyFileAccessMiddleware;
