import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';

const router = Router();

router.route('/login').post(authController.login);

router.route('/:id').get(userController.getUser);

router.use(authController.protect);

router
  .route('/')
  .post(authController.restrictTo('admin'), userController.createUser);

export default router;
