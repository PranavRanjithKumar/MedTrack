import { Router } from 'express';
import * as requestController from '../controllers/catalogue/requestController';
import * as authController from '../controllers/authController';

const router = Router();

router.use(
  authController.protect,
  authController.restrictToOrgs('supplier', 'manufacturer')
);

router
  .route('/')
  .get(
    authController.restrictToRoles('admin'),
    requestController.getAllRequests
  )
  .post(
    authController.restrictToRoles('admin', 'manager'),
    requestController.createRequestToAddToCatalogue
  );

router.use(authController.restrictToRoles('admin'));

router.route('/:id').get(requestController.getRequest);

router.route('/:id/approve').patch(requestController.handleRequestApproval);

export default router;
