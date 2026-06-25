import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const ReportsView = () => {
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState<{ report: any; action: 'reviewed' | 'dismissed' } | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => adminApi.getReports(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminApi.updateReportStatus(id, { status, adminNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setActionModal(null);
      setAdminNotes('');
    },
  });

  const filtered = (reports ?? []).filter((r: any) =>
    filter === 'all' ? true : r.status === filter
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">User Reports</h2>
        <div className="flex gap-2">
          {['pending', 'reviewed', 'dismissed', 'all'].map((f) => (
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
        ) : filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center text-gray-500">
            No {filter} reports
          </div>
        ) : (
          filtered.map((r: any) => (
            <div key={r.id} className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">Report #{r.id.slice(0, 8)}</h3>
                  <p className="text-sm text-gray-400">
                    Reporter: {r.reporter?.display_name || 'Unknown'} → Target: {r.target?.display_name || 'Unknown'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  r.status === 'reviewed' ? 'bg-green-900/50 text-green-300' :
                  r.status === 'dismissed' ? 'bg-gray-700 text-gray-300' :
                  'bg-yellow-900/50 text-yellow-300'
                }`}>
                  {r.status}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm mb-1">
                  <span className="text-gray-500">Reason: </span>
                  <span className="text-white">{r.reason}</span>
                </div>
                {r.description && (
                  <div className="text-sm">
                    <span className="text-gray-500">Description: </span>
                    <span className="text-white">{r.description}</span>
                  </div>
                )}
                {r.admin_notes && (
                  <div className="text-sm mt-2 pt-2 border-t border-gray-700">
                    <span className="text-gray-500">Admin notes: </span>
                    <span className="text-indigo-300">{r.admin_notes}</span>
                  </div>
                )}
              </div>

              {r.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => { setActionModal({ report: r, action: 'reviewed' }); setAdminNotes(''); }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                  >
                    ✓ Mark Reviewed
                  </button>
                  <button
                    onClick={() => { setActionModal({ report: r, action: 'dismissed' }); setAdminNotes(''); }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                  >
                    ✕ Dismiss
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setActionModal(null); setAdminNotes(''); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2 capitalize">
              {actionModal.action === 'reviewed' ? 'Mark as Reviewed' : 'Dismiss'} Report
            </h3>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Admin notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Add admin notes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setActionModal(null); setAdminNotes(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => mutation.mutate({
                  id: actionModal.report.id,
                  status: actionModal.action,
                  notes: adminNotes,
                })}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
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

export default ReportsView;
