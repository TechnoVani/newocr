import express from 'express';
import {
  getCompanies, addCompany, updateCompany, updateCompanyStatus
} from '../../controllers/accounts/companyController.js';

const router = express.Router();

router.get('/', getCompanies);
router.post('/', addCompany);
router.put('/:id', updateCompany);
router.patch('/:id/status', updateCompanyStatus);

export default router;
