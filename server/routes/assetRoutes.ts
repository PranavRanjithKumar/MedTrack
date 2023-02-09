import { Router } from 'express';
import * as assetController from '../controllers/transactions/assetController';
import * as authController from '../controllers/authController';

const router = Router({ mergeParams: true });

router.use(authController.protect, authController.connectToChannel);

// Recording the created asset
router
  .route('/')
  .post(
    authController.restrictToOrgs('supplier', 'manufacturer'),
    authController.allowOnlyOrgMembers,
    assetController.storeAsset
  );

// Get all the In-House produced goods
router
  .route('/in-house')
  .get(
    authController.restrictToOrgs('supplier', 'manufacturer'),
    authController.allowOnlyOrgMembers,
    assetController.getInHouseAssets
  );

// Get all the out-sourced goods
router
  .route('/out-sourced')
  .get(
    authController.restrictToOrgs('manufacturer', 'distributor', 'retailer'),
    authController.allowOnlyOrgMembers,
    assetController.getOutSourcedAssets
  );

router.route('/provenance').post(assetController.getAssetProvenance);
export default router;
