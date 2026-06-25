import { Router } from 'express';
import { adminAuth } from '../middleware/adminAuth';
import * as analyticsController from '../controllers/analyticsController';
import * as userController from '../controllers/userController';
import * as verificationController from '../controllers/verificationController';
import * as withdrawalController from '../controllers/withdrawalController';
import * as disputeController from '../controllers/disputeController';
import * as reportController from '../controllers/reportController';
import * as transactionController from '../controllers/transactionController';
import * as moderationController from '../controllers/moderationController';
import * as configController from '../controllers/configController';

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

router.get('/reports', reportController.listPendingReports);
router.post('/reports/:id/status', reportController.updateReportStatus);

router.get('/transactions', transactionController.listTransactions);
router.get('/payments', transactionController.listPayments);

router.get('/moderation/services', moderationController.listServices);
router.delete('/moderation/services/:id', moderationController.deleteService);
router.get('/moderation/jobs', moderationController.listJobs);
router.delete('/moderation/jobs/:id', moderationController.deleteJob);

router.get('/config/:table', configController.listTable);
router.post('/config/:table', configController.addTableEntry);
router.put('/config/:table/:id', configController.updateTableEntry);

export default router;
