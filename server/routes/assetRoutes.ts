import { Router } from 'express';
import * as assetStoreController from '../controllers/transactions/assetStoreController';
import * as authController from '../controllers/authController';

const router = Router();

router.use(authController.protect, authController.connectToChannel);

router.route('/').get(assetStoreController.readAsset);

export default router;
