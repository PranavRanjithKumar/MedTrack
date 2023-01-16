import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';

const router = Router({ mergeParams: true });

router.route('/login').post(authController.login);

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), userController.getAllUsers)
  .post(
    authController.restrictTo('admin', 'manager'),
    userController.createUser
  );

router
  .route('/:id')
  .get(authController.restrictTo('admin'), userController.getUser);

export default router;
