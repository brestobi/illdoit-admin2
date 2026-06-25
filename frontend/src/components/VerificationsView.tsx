import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';
import { supabase } from '../api/supabase';

const VerificationsView = () => {
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState<{ user: any; action: 'verified' | 'rejected' } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['verifications'],
    queryFn: () => adminApi.getVerifications(),
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: string; reason?: string }) =>
      adminApi.updateVerificationStatus(id, { status, rejectionReason: reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      setActionModal(null);
      setRejectionReason('');
    },
  });

  const filtered = (users ?? []).filter((u: any) =>
    filter === 'all' ? true : u.verification_status === filter
  );

  // Get document URLs from verification_metadata or direct columns
  const getDocUrls = (user: any) => {
    const meta = user.verification_metadata || {};
    return {
      idFront: user.id_front_url || meta.id_front_url || null,
      idBack: user.id_back_url || meta.id_back_url || null,
      selfie: user.selfie_url || meta.selfie_url || null,
      idType: meta.id_type || user.id_type || '—',
      submittedAt: meta.submitted_at || user.created_at,
    };
  };

  // Build a signed URL for private bucket images
  const getImageUrl = (url: string) => {
    if (!url) return null;
    // If it's already a full Supabase URL, use it directly
    if (url.startsWith('http')) return url;
    // Otherwise it's a storage path — construct the public URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/public/verification-docs/${url}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Identity Verifications</h2>
        <div className="flex gap-2">
          {['pending', 'verified', 'rejected', 'all'].map((f) => (
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

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-xl border border-gray-700 p-6 animate-pulse">
              <div className="h-5 bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-700 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-8 text-center text-gray-500">
            No {filter} verifications
          </div>
        ) : (
          filtered.map((user: any) => {
            const docs = getDocUrls(user);
            return (
              <div key={user.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{user.display_name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-400">{user.email || user.phone}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.verification_status === 'verified' ? 'bg-green-900/50 text-green-300' :
                      user.verification_status === 'rejected' ? 'bg-red-900/50 text-red-300' :
                      'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {user.verification_status}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="px-6 pb-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  {[
                    ['Real Name', user.real_name],
                    ['ID Number', user.id_number],
                    ['ID Type', docs.idType],
                    ['Address', user.address],
                    ['Bank', user.bank_name],
                    ['Account', user.bank_account_number ? `••••${user.bank_account_number.slice(-4)}` : '—'],
                    ['Branch Code', user.bank_branch_code],
                    ['Account Type', user.bank_account_type],
                    ['Submitted', docs.submittedAt ? new Date(docs.submittedAt).toLocaleDateString() : '—'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span className="text-gray-500 block text-xs">{label}</span>
                      <span className="text-white">{value || '—'}</span>
                    </div>
                  ))}
                </div>

                {/* Document Images */}
                {(docs.idFront || docs.idBack || docs.selfie) && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Verification Documents</p>
                    <div className="grid grid-cols-3 gap-4">
                      {docs.idFront && (
                        <div className="cursor-pointer group" onClick={() => setSelectedImage(docs.idFront)}>
                          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                            <img
                              src={getImageUrl(docs.idFront)!}
                              alt="ID Front"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>';
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">ID Front</p>
                        </div>
                      )}
                      {docs.idBack && (
                        <div className="cursor-pointer group" onClick={() => setSelectedImage(docs.idBack)}>
                          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                            <img
                              src={getImageUrl(docs.idBack)!}
                              alt="ID Back"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>';
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">ID Back</p>
                        </div>
                      )}
                      {docs.selfie && (
                        <div className="cursor-pointer group" onClick={() => setSelectedImage(docs.selfie)}>
                          <div className="aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
                            <img
                              src={getImageUrl(docs.selfie)!}
                              alt="Selfie"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-center">Selfie</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {user.verification_status === 'pending' && (
                  <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 flex gap-3">
                    <button
                      onClick={() => setActionModal({ user, action: 'verified' })}
                      className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      ✓ Approve Verification
                    </button>
                    <button
                      onClick={() => setActionModal({ user, action: 'rejected' })}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}

                {user.verification_rejection_reason && (
                  <div className="px-6 py-3 bg-red-900/20 border-t border-red-900/50 text-sm">
                    <span className="text-gray-500">Rejection reason: </span>
                    <span className="text-red-400">{user.verification_rejection_reason}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={getImageUrl(selectedImage)!}
              alt="Document preview"
              className="max-w-full max-h-[85vh] rounded-lg shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>';
              }}
            />
            <div className="flex justify-center mt-3 gap-4">
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setActionModal(null); setRejectionReason(''); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-2 capitalize">
              {actionModal.action} Verification
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {actionModal.action === 'verified'
                ? `Approve identity verification for ${actionModal.user.display_name}? Their status will update to "verified" immediately.`
                : `Reject identity verification for ${actionModal.user.display_name}?`}
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
                  id: actionModal.user.id,
                  status: actionModal.action,
                  reason: actionModal.action === 'rejected' ? rejectionReason : undefined,
                })}
                disabled={actionModal.action === 'rejected' && !rejectionReason.trim()}
                className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
                  actionModal.action === 'verified'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Confirm {actionModal.action === 'verified' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationsView;
