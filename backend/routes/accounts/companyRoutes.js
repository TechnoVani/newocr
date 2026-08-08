import express from 'express';
import {
  getCompanies, addCompany, updateCompany, updateCompanyStatus
} from '../../controllers/accounts/company.controller.js';
import { requireMinimumRole } from '../../middleware/departmentAccess.middleware.js';
import { ACCESS_ROLES } from '../../utils/roleAccess.js';

const router = express.Router();

router.get('/', getCompanies);
router.post('/', requireMinimumRole(ACCESS_ROLES.MANAGER), addCompany);
router.put('/:id', requireMinimumRole(ACCESS_ROLES.MANAGER), updateCompany);
router.patch('/:id/status', requireMinimumRole(ACCESS_ROLES.MANAGER), updateCompanyStatus);

export default router;
