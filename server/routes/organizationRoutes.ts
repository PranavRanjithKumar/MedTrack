import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';
import * as authController from '../controllers/authController';
import CatalogueRouter from './catalogueRoutes';

const router = Router();

router.use(authController.protect);

router.use('/:orgId/catalogue', CatalogueRouter);

router
  .route('/')
  .post(
    authController.restrictToRoles('admin'),
    organizationController.createOrganization
  );

export default router;
