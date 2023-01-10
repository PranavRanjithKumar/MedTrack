import { Router } from 'express';
import * as organizationController from '../controllers/organizationController';

const router = Router();

router.route('/').post(organizationController.createOrganization);

export default router;
