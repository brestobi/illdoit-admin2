import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listPendingReports = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_reports')
      .select('*, reporter:users!reporter_id(display_name), target:users!target_id(display_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Reports Error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const updateReportStatus = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body; // reviewed | dismissed

    const { error } = await supabaseAdmin
      .from('user_reports')
      .update({ 
        status, 
        admin_notes: adminNotes 
      })
      .eq('id', id);

    if (error) throw error;

    await logAdminAction(
        req.adminUser.id,
        `update_report_status_${status}`,
        'user_reports',
        id,
        { status: 'pending' },
        { status, adminNotes }
    );

    res.json({ message: `Report ${status} successfully` });
  } catch (error) {
    console.error('Update Report Status Error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
};
