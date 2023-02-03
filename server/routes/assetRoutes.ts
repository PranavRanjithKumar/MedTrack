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
    assetController.storeAsset
  );

// View details about an asset
router.route('/:id').get(assetController.getAsset);

export default router;
