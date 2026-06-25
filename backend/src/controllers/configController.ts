import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

// Generic handler for reference tables
export const listTable = async (req: AdminRequest, res: Response) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabaseAdmin.from(table).select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${req.params.table}` });
  }
};

export const updateTableEntry = async (req: AdminRequest, res: Response) => {
  try {
    const { table, id } = req.params;
    const { error } = await supabaseAdmin.from(table).update(req.body).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Entry updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

export const addTableEntry = async (req: AdminRequest, res: Response) => {
  try {
    const { table } = req.params;
    const { error } = await supabaseAdmin.from(table).insert(req.body);
    if (error) throw error;
    res.json({ message: 'Entry added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
};
