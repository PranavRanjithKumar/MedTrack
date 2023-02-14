import { Router } from 'express';
import * as authController from '../controllers/authController';
import * as catalogueController from '../controllers/catalogue/catalogueController';

const router = Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(catalogueController.getCatalogueForOrganization)
  .post(
    authController.restrictToOrgs('supplier', 'manufacturer'),
    authController.restrictToRoles('admin', 'manager', 'distributor'),
    authController.allowOnlyOrgMembers,
    catalogueController.addDrugToCatalogue,
    catalogueController.addCatalogueItemToCatalogue
  );

router.route('/:catalogueId').get(catalogueController.getCatalogueItem);

export default router;
