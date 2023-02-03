import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as userController from '../controllers/userController';

const router = Router({ mergeParams: true });

router.route('/login').post(authController.login);

// router.use(authController.protect);

router.route('/').post(
  // authController.restrictToRoles('admin', 'manager'),
  userController.createUser
);

router
  .route('/:id')
  .get(authController.restrictToRoles('admin'), userController.getUser);

export default router;
