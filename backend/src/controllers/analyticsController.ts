import { Request, Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

export const getAnalytics = async (req: AdminRequest, res: Response) => {
  try {
    // 1. Total Users
    const { count: totalUsers } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true });
    
    // 2. Pending Verifications
    const { count: pendingVerifications } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending');
    
    // ... add more metrics as per requirements
    
    res.json({
      totalUsers,
      pendingVerifications,
      // ...
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
