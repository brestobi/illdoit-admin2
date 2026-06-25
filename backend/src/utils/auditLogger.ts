import { supabaseAdmin } from '../utils/supabaseClient';

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetTable: string,
  targetId: string,
  oldData?: any,
  newData?: any
) => {
  try {
    const { error } = await supabaseAdmin
      .from('admin_audit_logs')
      .insert({
        admin_id: adminId,
        action,
        target_table: targetTable,
        target_id: targetId,
        old_data: oldData,
        new_data: newData
      });

    if (error) {
      console.error('Audit Log Error:', error);
    }
  } catch (error) {
    console.error('Audit Log Exception:', error);
  }
};
