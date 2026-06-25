import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

export const listServices = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('services').select('*, user:users(email)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const deleteService = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('services').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Service deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

export const listJobs = async (req: AdminRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('jobs').select('*, client:users(email)').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const deleteJob = async (req: AdminRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Job deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete job' });
  }
};
