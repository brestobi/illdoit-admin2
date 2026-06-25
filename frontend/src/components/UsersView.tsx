import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

const UsersView = () => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [statusAction, setStatusAction] = useState<{ id: string; status: string } | null>(null);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: () => adminApi.getUsers(search || undefined),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason: r }: { id: string; status: string; reason?: string }) =>
      adminApi.updateUserStatus(id, { status, reason: r }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setStatusAction(null);
      setReason('');
    },
  });

  const users = data?.users ?? data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-80 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Email</th>
              <th className="py-3 px-4 font-medium">Type</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Verified</th>
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">No users found</td></tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white font-medium">{user.display_name || '—'}</td>
                  <td className="py-3 px-4 text-gray-300">{user.email || user.phone || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.user_type === 'admin' ? 'bg-purple-900/50 text-purple-300' :
                      user.user_type === 'job_seeker' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {user.user_type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.account_status === 'active' ? 'bg-green-900/50 text-green-300' :
                      user.account_status === 'suspended' ? 'bg-yellow-900/50 text-yellow-300' :
                      user.account_status === 'banned' ? 'bg-red-900/50 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {user.account_status || 'active'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {user.is_verified ? (
                      <span className="text-green-400">✓ Verified</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                      >
                        View
                      </button>
                      {user.account_status === 'active' ? (
                        <button
                          onClick={() => setStatusAction({ id: user.id, status: 'suspended' })}
                          className="px-3 py-1 text-xs bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-300 rounded transition-colors"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => statusMutation.mutate({ id: user.id, status: 'active' })}
                          className="px-3 py-1 text-xs bg-green-900/50 hover:bg-green-800/50 text-green-300 rounded transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {user.account_status !== 'banned' && (
                        <button
                          onClick={() => setStatusAction({ id: user.id, status: 'banned' })}
                          className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded transition-colors"
                        >
                          Ban
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedUser(null)}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-lg p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">User Details</h3>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['Name', selectedUser.display_name],
                ['Email', selectedUser.email],
                ['Phone', selectedUser.phone],
                ['Type', selectedUser.user_type],
                ['Status', selectedUser.account_status],
                ['Verified', selectedUser.is_verified ? 'Yes' : 'No'],
                ['Rating', selectedUser.rating],
                ['Completed Jobs', selectedUser.completed_jobs],
                ['Balance', `R ${Number(selectedUser.balance || 0).toLocaleString()}`],
                ['Escrow', `R ${Number(selectedUser.escrow_balance || 0).toLocaleString()}`],
                ['Location', selectedUser.location],
                ['Joined', selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white">{value ?? '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Action Modal */}
      {statusAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setStatusAction(null); setReason(''); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4 capitalize">{statusAction.status} User</h3>
            <p className="text-gray-400 text-sm mb-4">Are you sure you want to <strong className="text-white">{statusAction.status}</strong> this user?</p>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Enter reason..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setStatusAction(null); setReason(''); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => statusMutation.mutate({ id: statusAction.id, status: statusAction.status, reason })}
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

export default UsersView;
