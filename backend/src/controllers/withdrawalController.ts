import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listPendingWithdrawals = async (req: AdminRequest, res: Response) => {
  try {
    const { status: filterStatus } = req.query;
    let query = supabaseAdmin
      .from('withdrawal_requests')
      .select('*, users(display_name, email)');

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus as string);
    } else {
      query = query.in('status', ['pending', 'processed', 'rejected']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Withdrawals Error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
};

export const processWithdrawal = async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body; // processed | rejected

    // 1. Get the withdrawal request with user info for transaction lookup
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*, users!inner(display_name, email)')
      .eq('id', id)
      .single();

    if (fetchError || !withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    // 2. Update request status
    const { error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status: status,
        rejection_reason: rejectionReason || null,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Sync the associated transaction
    const transactionStatus = status === 'processed' ? 'completed' : 'cancelled';
    const { error: txnError } = await supabaseAdmin
      .from('transactions')
      .update({ status: transactionStatus })
      .eq('type', 'withdrawal')
      .eq('sender_id', withdrawal.user_id)
      .eq('status', 'pending');

    if (txnError) {
      console.error('Failed to sync transaction status:', txnError);
    }

    // 4. Audit log
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
