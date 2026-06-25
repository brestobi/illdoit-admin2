import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

// ... listUsers (no changes)

export const updateUserStatus = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body; // active | suspended | banned

    // 1. Get old data for audit log
    const { data: oldUser } = await supabaseAdmin
      .from('users')
      .select('account_status, suspension_reason')
      .eq('id', id)
      .single();

    // 2. Perform update
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        account_status: status, 
        suspension_reason: reason 
      })
      .eq('id', id);

    if (error) throw error;

    // 3. Log action
    await logAdminAction(
        req.adminUser.id,
        'update_user_status',
        'users',
        id,
        oldUser,
        { account_status: status, suspension_reason: reason }
    );

    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};
