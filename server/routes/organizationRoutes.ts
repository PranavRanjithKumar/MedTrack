import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';
import * as authController from '../controllers/authController';
import CatalogueRouter from './catalogueRoutes';
import AssetRouter from './assetRoutes';
import demandRouter from './demandRoutes';
import transferRouter from './transferRoutes';

const router = Router();

router.use('/:orgId/catalogue', CatalogueRouter);
router.use('/:orgId/assets', AssetRouter);
router.use('/:orgId/demands', demandRouter);
router.use('/:orgId/transfers', transferRouter);

router.use(authController.protect);

router
  .route('/requestable-orgs')
  .get(organizationController.getRequestableOrganizations);

router
  .route('/')
  .post(
    authController.restrictToRoles('admin'),
    organizationController.createOrganization
  );

export default router;
