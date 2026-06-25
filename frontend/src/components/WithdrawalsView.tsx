import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const WithdrawalsView = () => {
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState<{ withdrawal: any; action: 'processed' | 'rejected' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ['withdrawals', filter],
    queryFn: () => adminApi.getWithdrawals(filter),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminApi.processWithdrawal(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
      setActionModal(null);
      setRejectionReason('');
    },
  });

  const list = withdrawals ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Withdrawal Requests</h2>
        <div className="flex gap-2">
          {['pending', 'processed', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-6 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
          ))
        ) : list.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center text-gray-500">
            No {filter} withdrawal requests
          </div>
        ) : (
          list.map((w: any) => (
            <div key={w.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    R {Number(w.amount).toLocaleString()}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {w.users?.display_name || 'Unknown'} — {w.users?.email || ''}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  w.status === 'processed' ? 'bg-green-900/50 text-green-300' :
                  w.status === 'rejected' ? 'bg-red-900/50 text-red-300' :
                  'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {w.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                {[
                  ['Bank', w.bank_name],
                  ['Account Holder', w.account_holder],
                  ['Account Number', w.account_number ? `••••${w.account_number.slice(-4)}` : '—'],
                  ['Branch Code', w.branch_code],
                  ['Account Type', w.account_type],
                  ['Requested', new Date(w.created_at).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-gray-500 block">{label}</span>
                    <span className="text-white">{value || '—'}</span>
                  </div>
                ))}
              </div>

              {w.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setActionModal({ withdrawal: w, action: 'processed' })}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setActionModal({ withdrawal: w, action: 'rejected' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}

              {w.rejection_reason && (
                <div className="mt-3 pt-3 border-t border-gray-700 text-sm">
                  <span className="text-gray-500">Reason: </span>
                  <span className="text-red-400">{w.rejection_reason}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setActionModal(null); setRejectionReason(''); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">
              {actionModal.action === 'processed' ? 'Approve' : 'Reject'} Withdrawal
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {actionModal.action === 'processed'
                ? `Approve R ${Number(actionModal.withdrawal.amount).toLocaleString()} withdrawal to ${actionModal.withdrawal.bank_name} account ending in ${actionModal.withdrawal.account_number?.slice(-4) || '?'}?`
                : `Reject R ${Number(actionModal.withdrawal.amount).toLocaleString()} withdrawal request?`}
            </p>

            {actionModal.action === 'rejected' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-1">Rejection reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setActionModal(null); setRejectionReason(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate({
                  id: actionModal.withdrawal.id,
                  status: actionModal.action,
                  reason: actionModal.action === 'rejected' ? rejectionReason : undefined,
                })}
                disabled={actionModal.action === 'rejected' && !rejectionReason.trim()}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  actionModal.action === 'processed'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalsView;
