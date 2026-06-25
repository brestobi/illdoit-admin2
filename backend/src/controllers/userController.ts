import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listUsers = async (req: AdminRequest, res: Response) => {
  try {
    const { q, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' });

    if (q) {
      const search = `%${q}%`;
      query = query.or(`display_name.ilike.${search},email.ilike.${search}`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) throw error;

    res.json({
      users: data,
      total: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error('List Users Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const updateUserStatus = async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, reason } = req.body; // active | suspended | banned

    // 1. Get old data for audit log
    const { data: oldUser } = await supabaseAdmin
      .from('users')
      .select('account_status, suspension_reason, user_type')
      .eq('id', id)
      .single();

    if (!oldUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // 2. Perform update
    const updateData: Record<string, any> = { account_status: status };
    if (status === 'active') {
      updateData.suspension_reason = null;
      updateData.suspended_until = null;
    } else {
      updateData.suspension_reason = reason || null;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // 3. Log action
    await logAdminAction(
      req.adminUser.id,
      'update_user_status',
      'users',
      id,
      oldUser,
      updateData
    );

    res.json({ message: `User ${status} successfully` });
  } catch (error) {
    console.error('Update User Status Error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};
