import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listPendingWithdrawals = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*, users(display_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Withdrawals Error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
};

export const processWithdrawal = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // processed | rejected

    // 1. Update request status
    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({ 
        status: status,
        rejection_reason: rejectionReason
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Logic for updating associated transaction
    // Note: The actual balance update happens via trigger in DB.
    // Admin just marks the withdrawal request as processed/rejected.
    
    await logAdminAction(
        req.adminUser.id,
        `process_withdrawal_${status}`,
        'withdrawal_requests',
        id,
        { status: 'pending' },
        { status, rejectionReason }
    );

    res.json({ message: `Withdrawal ${status} successfully` });
  } catch (error) {
    console.error('Process Withdrawal Error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal' });
  }
};
