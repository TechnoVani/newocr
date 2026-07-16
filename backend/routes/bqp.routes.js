import express from 'express';
import BqpController from '../controllers/bqp.controller.js';

const router = express.Router();

router.get('/bqp', BqpController.getBqp);
router.get('/reporting/:bqpId', BqpController.getReportingManagers);
router.get('/relationships/:managerId', BqpController.getRelationshipManagers);
router.get('/posp/:relationshipId', BqpController.getPosps);
router.get('/references/posp/:pospId', BqpController.getReferencesByPospId);

export default router;