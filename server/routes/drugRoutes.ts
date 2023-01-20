import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as drugController from '../controllers/catalogue/drugController';
import catalogueRouter from './catalogueRoutes';

const router = Router();

router.use(authController.protect);

router.use('/:drugId/catalogue', catalogueRouter);

router.route('/').get(drugController.getAllDrugs);

router.route('/:id').get(drugController.getDrug);

export default router;
