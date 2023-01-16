import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';

const router = Router();

router.route('/login').post(authController.login);

router.use(authController.protect);

router.route('/').post(userController.createUser);

router.route('/:id').get(userController.getUser);

export default router;
