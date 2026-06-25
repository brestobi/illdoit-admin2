import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const DisputesView = () => {
  const [filter, setFilter] = useState('open');
  const [resolveModal, setResolveModal] = useState<{
    dispute: any;
    action: 'refund' | 'release';
  } | null>(null);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const queryClient = useQueryClient();

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes', filter],
    queryFn: () => adminApi.getDisputes(filter),
  });

  const mutation = useMutation({
    mutationFn: ({ id, summary, action }: { id: string; summary: string; action: 'refund' | 'release' }) =>
      adminApi.resolveDispute(id, { resolutionSummary: summary, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      setResolveModal(null);
      setResolutionSummary('');
    },
  });

  const list = disputes ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Disputes</h2>
        <div className="flex gap-2">
          {['open', 'under_review', 'resolved', 'cancelled', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {f.replace('_', ' ')}
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
            No disputes found
          </div>
        ) : (
          list.map((d: any) => (
            <div key={d.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Dispute #{d.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-400">
                    Raised by: {d.users?.display_name || 'Unknown'} — R{' '}
                    {Number(d.orders?.amount || 0).toLocaleString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  d.status === 'resolved' ? 'bg-green-900/50 text-green-300' :
                  d.status === 'cancelled' ? 'bg-red-900/50 text-red-300' :
                  d.status === 'under_review' ? 'bg-blue-900/50 text-blue-300' :
                  'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {d.status.replace('_', ' ')}
                </span>
              </div>

              <div className="text-sm space-y-2 mb-4">
                <div><span className="text-gray-500">Reason: </span><span className="text-white">{d.reason}</span></div>
                {d.description && (
                  <div><span className="text-gray-500">Description: </span><span className="text-white">{d.description}</span></div>
                )}
                {d.resolution_summary && (
                  <div><span className="text-gray-500">Resolution: </span><span className="text-white">{d.resolution_summary}</span></div>
                )}
                <div><span className="text-gray-500">Created: </span><span className="text-white">{new Date(d.created_at).toLocaleDateString()}</span></div>
              </div>

              {(d.status === 'open' || d.status === 'under_review') && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => { setResolveModal({ dispute: d, action: 'refund' }); setResolutionSummary(''); }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ↺ Refund Buyer
                  </button>
                  <button
                    onClick={() => { setResolveModal({ dispute: d, action: 'release' }); setResolutionSummary(''); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ➦ Release to Seller
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setResolveModal(null); setResolutionSummary(''); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2">
              {resolveModal.action === 'refund' ? 'Refund Buyer' : 'Release to Seller'}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {resolveModal.action === 'refund'
                ? 'This will cancel the escrow transaction and return funds to the buyer.'
                : 'This will complete the escrow transaction and release funds to the seller.'}
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Resolution Summary *</label>
              <textarea
                value={resolutionSummary}
                onChange={(e) => setResolutionSummary(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Describe the resolution..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setResolveModal(null); setResolutionSummary(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate({
                  id: resolveModal.dispute.id,
                  summary: resolutionSummary,
                  action: resolveModal.action,
                })}
                disabled={!resolutionSummary.trim()}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesView;
