import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as drugController from '../controllers/catalogue/drugController';

const router = Router();

router.use(authController.protect);

router.route('/').get(drugController.getAllDrugs);

router.route('/:id').get(drugController.getDrug);

export default router;
