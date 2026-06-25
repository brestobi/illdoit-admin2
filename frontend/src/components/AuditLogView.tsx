import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const ACTION_LABELS: Record<string, string> = {
  update_user_status: 'Update User Status',
  reverse_update_user_status: '↩ Reverse: User Status',
  update_verification_status: 'Update Verification',
  reverse_update_verification_status: '↩ Reverse: Verification',
  process_withdrawal_processed: 'Approve Withdrawal',
  process_withdrawal_rejected: 'Reject Withdrawal',
  reverse_process_withdrawal: '↩ Reverse: Withdrawal Rejection',
  resolve_dispute_refund: 'Resolve Dispute (Refund)',
  resolve_dispute_release: 'Resolve Dispute (Release)',
  update_report_status: 'Update Report Status',
  reverse_update_report_status: '↩ Reverse: Report',
};

const REVERSIBLE_ACTIONS = [
  'update_user_status',
  'process_withdrawal_rejected',
  'update_verification_status',
  'update_report_status',
];

const AuditLogView = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [reverseModal, setReverseModal] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: () => adminApi.getAuditLogs({ page: String(page), action: actionFilter || undefined }),
  });

  const reverseMutation = useMutation({
    mutationFn: (id: string) => adminApi.reverseAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setReverseModal(null);
    },
  });

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / (data?.limit || 50));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="py-3 px-4 font-medium">Action</th>
              <th className="py-3 px-4 font-medium">Admin</th>
              <th className="py-3 px-4 font-medium">Target</th>
              <th className="py-3 px-4 font-medium">Target ID</th>
              <th className="py-3 px-4 font-medium">Date</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">No audit logs found</td></tr>
            ) : (
              logs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      log.action.includes('reverse') ? 'bg-yellow-900/50 text-yellow-300' :
                      log.action.includes('approved') || log.action === 'update_verification_status' ? 'bg-green-900/50 text-green-300' :
                      log.action.includes('rejected') || log.action.includes('suspend') || log.action.includes('ban') ? 'bg-red-900/50 text-red-300' :
                      'bg-blue-900/50 text-blue-300'
                    }`}>
                      {ACTION_LABELS[log.action] || log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-white text-sm">{log.admin_name}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{log.target_table}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">{log.target_id?.slice(0, 8)}...</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{new Date(log.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors mr-2"
                    >
                      View
                    </button>
                    {log.reversible && (
                      <button
                        onClick={() => setReverseModal(log)}
                        className="px-3 py-1 text-xs bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-300 rounded transition-colors"
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => p - 1)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedLog(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl p-6 mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">Action Detail</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Action', ACTION_LABELS[selectedLog.action] || selectedLog.action],
                  ['Admin', selectedLog.admin_name],
                  ['Admin Email', selectedLog.admin_email],
                  ['Target Table', selectedLog.target_table],
                  ['Target ID', selectedLog.target_id],
                  ['Date', new Date(selectedLog.created_at).toLocaleString()],
                  ['Reversible', selectedLog.reversible ? 'Yes' : 'No'],
                  ['IP Address', selectedLog.ip_address || '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-gray-500 block text-xs">{label}</span>
                    <span className="text-white text-sm break-all">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {selectedLog.old_data && (
                <div>
                  <span className="text-gray-500 block text-xs mb-1">Previous Values</span>
                  <pre className="bg-gray-900 p-3 rounded-lg text-gray-300 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <span className="text-gray-500 block text-xs mb-1">New Values</span>
                  <pre className="bg-gray-900 p-3 rounded-lg text-gray-300 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reverse Confirmation Modal */}
      {reverseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setReverseModal(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">Reverse Action</h3>
            <p className="text-gray-400 text-sm mb-4">
              Are you sure you want to reverse this action?
            </p>
            <div className="bg-gray-900 rounded-lg p-3 mb-4 text-sm">
              <span className="text-gray-500">Action: </span>
              <span className="text-white">{ACTION_LABELS[reverseModal.action] || reverseModal.action}</span>
              <br />
              <span className="text-gray-500">Target: </span>
              <span className="text-white">{reverseModal.target_table} / {reverseModal.target_id?.slice(0, 8)}</span>
              <br />
              <span className="text-gray-500">Performed by: </span>
              <span className="text-white">{reverseModal.admin_name}</span>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReverseModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={() => reverseMutation.mutate(reverseModal.id)}
                disabled={reverseMutation.isPending}
                className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {reverseMutation.isPending ? 'Reversing...' : 'Confirm Reverse'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogView;
