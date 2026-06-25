import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

export const listTransactions = async (req: AdminRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    let query = supabaseAdmin.from('transactions').select('*, sender:users!sender_id(email), receiver:users!receiver_id(email)');

    if (type) query = query.eq('type', type);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Transactions Error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

export const listPayments = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, user:users(email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('List Payments Error:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};
