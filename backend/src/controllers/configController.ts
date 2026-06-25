import { Response } from 'express';
import { supabaseAdmin } from '../utils/supabaseClient';
import { AdminRequest } from '../middleware/adminAuth';

const ALLOWED_TABLES = ['categories', 'skills', 'locations', 'id_types', 'supported_banks', 'report_reasons', 'dispute_reasons'];

// Generic handler for reference tables
export const listTable = async (req: AdminRequest, res: Response) => {
  try {
    const table = req.params.table as string;
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Invalid table: ${table}` });
    }
    const { data, error } = await supabaseAdmin.from(table as any).select('*');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch ${req.params.table}` });
  }
};

export const updateTableEntry = async (req: AdminRequest, res: Response) => {
  try {
    const table = req.params.table as string;
    const id = req.params.id as string;
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Invalid table: ${table}` });
    }
    const { error } = await supabaseAdmin.from(table as any).update(req.body).eq('id', id);
    if (error) throw error;
    res.json({ message: 'Entry updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

export const addTableEntry = async (req: AdminRequest, res: Response) => {
  try {
    const table = req.params.table as string;
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Invalid table: ${table}` });
    }
    const { error } = await supabaseAdmin.from(table as any).insert(req.body);
    if (error) throw error;
    res.json({ message: 'Entry added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add entry' });
  }
};
