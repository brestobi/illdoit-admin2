import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listPendingVerifications = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Verifications Error:', error);
    res.status(500).json({ error: 'Failed to fetch verifications' });
  }
};

export const updateVerificationStatus = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body; // verified | rejected

    const updateData: any = { verification_status: status };
    if (status === 'verified') {
        updateData.is_verified = true;
    } else {
        updateData.verification_rejection_reason = rejectionReason;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(
        req.adminUser.id,
        'update_verification_status',
        'users',
        id,
        { status: 'pending' },
        updateData
    );

    res.json({ message: `Verification ${status} successfully` });
  } catch (error) {
    console.error('Update Verification Status Error:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
};
