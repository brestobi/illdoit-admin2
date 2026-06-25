import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

export const getAnalytics = async (req: AdminRequest, res: Response) => {
  try {
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: newUsersToday },
      { count: pendingVerifications },
      { count: pendingWithdrawals },
      { count: openDisputes },
      { count: totalTransactions },
      { count: completedTransactions },
      { count: totalServices },
      { count: totalJobs },
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabaseAdmin.from('withdrawal_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'under_review']),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabaseAdmin.from('services').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }),
    ]);

    // Balance aggregates
    const { data: balanceData } = await supabaseAdmin
      .from('users')
      .select('balance, escrow_balance');

    const totalBalance = balanceData?.reduce((sum, u) => sum + Number(u.balance || 0), 0) || 0;
    const totalEscrow = balanceData?.reduce((sum, u) => sum + Number(u.escrow_balance || 0), 0) || 0;

    // Transaction volume
    const { data: volumeData } = await supabaseAdmin
      .from('transactions')
      .select('amount')
      .eq('status', 'completed');

    const transactionVolume = volumeData?.reduce((sum, t) => sum + Number(t.amount || 0), 0) || 0;

    res.json({
      totalUsers,
      verifiedUsers,
      newUsersToday,
      pendingVerifications,
      pendingWithdrawals,
      openDisputes,
      totalTransactions,
      completedTransactions,
      totalServices,
      totalJobs,
      totalBalance,
      totalEscrow,
      transactionVolume,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
