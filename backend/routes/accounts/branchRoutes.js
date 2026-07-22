import express from 'express';
import { getBranches, addBranch, updateBranch, updateBranchStatus } from '../../controllers/accounts/branchController.js';

const router = express.Router();

router.get('/', getBranches);
router.post('/', addBranch);
router.put('/:id', updateBranch);
router.patch('/:id/status', updateBranchStatus);

export default router;
