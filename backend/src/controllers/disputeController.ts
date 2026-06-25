import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listOpenDisputes = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('disputes')
      .select('*, orders(*), users!raised_by(display_name)')
      .in('status', ['open', 'under_review'])
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Disputes Error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
};

export const resolveDispute = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { resolutionSummary, action } = req.body; // refund | release

    // 1. Update dispute status
    const { error: updateError } = await supabaseAdmin
      .from('disputes')
      .update({ 
        status: 'resolved',
        resolution_summary: resolutionSummary,
        resolved_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 2. Logic for updating transaction would go here (depending on requirements)
    
    await logAdminAction(
        req.adminUser.id,
        `resolve_dispute_${action}`,
        'disputes',
        id,
        { status: 'open/under_review' },
        { status: 'resolved', action }
    );

    res.json({ message: 'Dispute resolved successfully' });
  } catch (error) {
    console.error('Resolve Dispute Error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
};
