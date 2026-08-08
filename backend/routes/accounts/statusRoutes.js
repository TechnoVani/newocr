import express from 'express';
import { getStatus } from '../../controllers/accounts/status.controller.js';

const router = express.Router();

router.get('/', getStatus);

export default router;
