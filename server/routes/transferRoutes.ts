import { Router } from 'express';
import * as transferController from '../controllers/transactions/transferController';
import * as authController from '../controllers/authController';

const router = Router({ mergeParams: true });

router.use(
  authController.protect,
  authController.restrictToOrgs(
    'supplier',
    'manufacturer',
    'distributor',
    'retailer'
  ),
  authController.allowOnlyOrgMembers,
  authController.connectToChannel
);

router
  .route('/')
  .get(transferController.getAllTransfers)
  .post(transferController.initiateTransfer);

router.route('/:reqId').get(transferController.getOneTransfer);

export default router;
