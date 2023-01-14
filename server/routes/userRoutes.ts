import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.route('/').post(userController.createUser);

router.route('/:id').get(userController.getUser);

export default router;
