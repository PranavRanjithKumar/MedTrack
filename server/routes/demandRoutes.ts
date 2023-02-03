import { Router } from 'express';
import * as transferController from '../controllers/transactions/transferController';
import * as authController from '../controllers/authController';

const router = Router({ mergeParams: true });

router.use(authController.protect, authController.connectToChannel);

router
  .route('/')
  .post(
    authController.restrictToOrgs(
      'manufacturer',
      'distributor',
      'retailer',
      'consumer'
    ),
    transferController.makeRequest
  );

export default router;
