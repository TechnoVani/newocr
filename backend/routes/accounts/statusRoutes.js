import express from 'express';
import { getStatus } from '../../controllers/accounts/statusController.js';

const router = express.Router();

router.get('/', getStatus);

export default router;
