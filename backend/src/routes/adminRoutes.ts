import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import * as analyticsController from '../controllers/analyticsController';
import * as userController from '../controllers/userController';
import * as verificationController from '../controllers/verificationController';
import * as withdrawalController from '../controllers/withdrawalController';
import * as disputeController from '../controllers/disputeController';

const router = Router();

router.use(adminAuth);

router.get('/analytics', analyticsController.getAnalytics);

router.get('/users', userController.listUsers);
router.post('/users/:id/status', userController.updateUserStatus);

router.get('/verifications', verificationController.listPendingVerifications);
router.post('/verifications/:id/status', verificationController.updateVerificationStatus);

router.get('/withdrawals', withdrawalController.listPendingWithdrawals);
router.post('/withdrawals/:id/status', withdrawalController.processWithdrawal);

router.get('/disputes', disputeController.listOpenDisputes);
router.post('/disputes/:id/resolve', disputeController.resolveDispute);

export default router;
