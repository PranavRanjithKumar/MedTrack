import { Router } from 'express';
import * as transferController from '../controllers/transactions/transferController';
import * as authController from '../controllers/authController';

const router = Router({ mergeParams: true });

router.use(
  authController.protect,
  authController.restrictToOrgs(
    'manufacturer',
    'distributor',
    'retailer',
    'consumer'
  ),
  authController.allowOnlyOrgMembers,
  authController.connectToChannel
);

router
  .route('/')
  .get(transferController.getAllRequests)
  .post(transferController.makeRequest);

router.route('/:reqId').get(transferController.getOneRequest);

export default router;
