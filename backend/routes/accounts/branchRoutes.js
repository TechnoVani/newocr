import express from 'express';
import { getBranches, addBranch, updateBranch, updateBranchStatus } from '../../controllers/accounts/branchController.js';
import { requireMinimumRole } from '../../middleware/departmentAccess.middleware.js';
import { ACCESS_ROLES } from '../../utils/roleAccess.js';

const router = express.Router();

router.get('/', getBranches);
router.post('/', requireMinimumRole(ACCESS_ROLES.MANAGER), addBranch);
router.put('/:id', requireMinimumRole(ACCESS_ROLES.MANAGER), updateBranch);
router.patch('/:id/status', requireMinimumRole(ACCESS_ROLES.MANAGER), updateBranchStatus);

export default router;
