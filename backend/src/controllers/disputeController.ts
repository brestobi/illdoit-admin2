import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';
import { logAdminAction } from '../utils/auditLogger';

export const listOpenDisputes = async (req: AdminRequest, res: Response) => {
  try {
    const { status: filterStatus } = req.query;
    let query = supabaseAdmin
      .from('disputes')
      .select('*, orders(*), users!raised_by(display_name)');

    if (filterStatus && filterStatus !== 'all') {
      query = query.eq('status', filterStatus as string);
    } else {
      query = query.in('status', ['open', 'under_review']);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Disputes Error:', error);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
};

export const resolveDispute = async (req: AdminRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { resolutionSummary, action } = req.body; // refund | release

    // 1. Get dispute with order details
    const { data: dispute, error: fetchError } = await supabaseAdmin
      .from('disputes')
      .select('*, orders!inner(id, buyer_id, seller_id, amount)')
      .eq('id', id)
      .single();

    if (fetchError || !dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const order = dispute.orders as any;

    // 2. Handle escrow transaction based on action
    if (action === 'refund') {
      const { error: txnError } = await supabaseAdmin
        .from('transactions')
        .update({ status: 'cancelled' })
        .eq('order_id', order.id)
        .eq('type', 'escrow')
        .eq('status', 'pending');

      if (txnError) throw txnError;
    } else if (action === 'release') {
      const { error: txnError } = await supabaseAdmin
        .from('transactions')
        .update({ status: 'completed' })
        .eq('order_id', order.id)
        .eq('type', 'escrow')
        .eq('status', 'pending');

      if (txnError) throw txnError;
    }

    // 3. Update dispute status
    const { error: updateError } = await supabaseAdmin
      .from('disputes')
      .update({
        status: 'resolved',
        resolution_summary: resolutionSummary,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) throw updateError;

    // 4. Audit log
    await logAdminAction(
      req.adminUser.id,
      `resolve_dispute_${action}`,
      'disputes',
      id,
      { status: 'open/under_review' },
      { status: 'resolved', action, resolutionSummary }
    );

    res.json({ message: `Dispute resolved — ${action === 'refund' ? 'buyer refunded' : 'funds released to seller'}` });
  } catch (error) {
    console.error('Resolve Dispute Error:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
};
