import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';

export interface AdminRequest extends Request {
  adminUser?: any;
}

export const adminAuth = async (req: AdminRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 1. Verify the user with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 2. Check if the user is an admin in the public.users table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Attach user to request and proceed
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Admin Auth Error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
