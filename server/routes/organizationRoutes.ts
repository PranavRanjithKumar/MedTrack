import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';
import * as authController from '../controllers/authController';
import UserRouter from './userRoutes';

const router = Router();

router.use(authController.protect);

router.use('/:orgId/users', UserRouter);

router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    organizationController.createOrganization
  );

export default router;
