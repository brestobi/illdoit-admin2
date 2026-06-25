import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

// Actions that can be reversed
const REVERSIBLE_ACTIONS = [
  'update_user_status',
  'process_withdrawal_rejected',
  'update_verification_status',
  'update_report_status',
];

export const listLogs = async (req: AdminRequest, res: Response) => {
  try {
    const { action, adminId, targetTable, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('admin_audit_logs')
      .select('*, users!admin_id(display_name, email)', { count: 'exact' });

    if (action) query = query.eq('action', action as string);
    if (adminId) query = query.eq('admin_id', adminId as string);
    if (targetTable) query = query.eq('target_table', targetTable as string);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      logs: (data || []).map((log: any) => ({
        ...log,
        reversible: REVERSIBLE_ACTIONS.includes(log.action),
        admin_name: log.users?.display_name || 'Unknown',
        admin_email: log.users?.email || '',
      })),
      total: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('List Audit Logs Error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
};

export const getLogDetail = async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const { data, error } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*, users!admin_id(display_name, email)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Log not found' });
    }

    res.json({
      ...data,
      reversible: REVERSIBLE_ACTIONS.includes(data.action),
      admin_name: (data as any).users?.display_name || 'Unknown',
      admin_email: (data as any).users?.email || '',
    });
  } catch (error) {
    console.error('Get Audit Log Detail Error:', error);
    res.status(500).json({ error: 'Failed to fetch log detail' });
  }
};

export const reverseAction = async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    // Fetch the log entry
    const { data: log, error: fetchError } = await supabaseAdmin
      .from('admin_audit_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    if (!REVERSIBLE_ACTIONS.includes(log.action)) {
      return res.status(400).json({ error: `Action "${log.action}" cannot be reversed.` });
    }

    const action = log.action;
    const targetId = log.target_id;
    const oldData = log.old_data || {};

    switch (action) {
      case 'update_user_status': {
        // Restore previous account_status
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            account_status: oldData.account_status || 'active',
            suspension_reason: oldData.suspension_reason || null,
            suspended_until: oldData.suspended_until || null,
          })
          .eq('id', targetId);

        if (error) throw error;

        await logAdminAction(
          req.adminUser.id,
          'reverse_update_user_status',
          'users',
          targetId,
          null,
          { reversed_from: log.action, restored_status: oldData.account_status }
        );

        return res.json({ message: `User status reverted to "${oldData.account_status || 'active'}"` });
      }

      case 'update_verification_status': {
        // Restore previous verification status
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            verification_status: oldData.verification_status || 'unverified',
            is_verified: oldData.verification_status === 'verified',
            verification_rejection_reason: null,
          })
          .eq('id', targetId);

        if (error) throw error;

        await logAdminAction(
          req.adminUser.id,
          'reverse_update_verification_status',
          'users',
          targetId,
          null,
          { reversed_from: log.action }
        );

        return res.json({ message: 'Verification status reverted' });
      }

      case 'process_withdrawal_rejected': {
        // Set withdrawal back to pending
        const { error } = await supabaseAdmin
          .from('withdrawal_requests')
          .update({
            status: 'pending',
            rejection_reason: null,
          })
          .eq('id', targetId);

        if (error) throw error;

        // Also revert the transaction
        await supabaseAdmin
          .from('transactions')
          .update({ status: 'pending' })
          .eq('type', 'withdrawal')
          .eq('status', 'cancelled');

        await logAdminAction(
          req.adminUser.id,
          'reverse_process_withdrawal',
          'withdrawal_requests',
          targetId,
          null,
          { reversed_from: log.action }
        );

        return res.json({ message: 'Withdrawal request re-opened' });
      }

      case 'update_report_status': {
        // Set report back to pending
        const { error } = await supabaseAdmin
          .from('user_reports')
          .update({
            status: 'pending',
            admin_notes: null,
          })
          .eq('id', targetId);

        if (error) throw error;

        await logAdminAction(
          req.adminUser.id,
          'reverse_update_report_status',
          'user_reports',
          targetId,
          null,
          { reversed_from: log.action }
        );

        return res.json({ message: 'Report re-opened' });
      }

      default:
        return res.status(400).json({ error: 'Unknown action type' });
    }
  } catch (error) {
    console.error('Reverse Action Error:', error);
    res.status(500).json({ error: 'Failed to reverse action' });
  }
};
