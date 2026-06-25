import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const ContentView = () => {
  const [tab, setTab] = useState<'services' | 'jobs'>('services');
  const queryClient = useQueryClient();

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => adminApi.getServices(),
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => adminApi.getJobs(),
  });

  const deleteService = useMutation({
    mutationFn: (id: string) => adminApi.deleteService(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] }),
  });

  const deleteJob = useMutation({
    mutationFn: (id: string) => adminApi.deleteJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs'] }),
  });

  const isLoading = tab === 'services' ? servicesLoading : jobsLoading;
  const list = tab === 'services' ? (services ?? []) : (jobs ?? []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Content Moderation</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('services')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'services' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            Services ({services?.length ?? 0})
          </button>
          <button
            onClick={() => setTab('jobs')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'jobs' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            Jobs ({jobs?.length ?? 0})
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="py-3 px-4 font-medium">Title</th>
              <th className="py-3 px-4 font-medium">User</th>
              <th className="py-3 px-4 font-medium">Category</th>
              <th className="py-3 px-4 font-medium">Amount</th>
              <th className="py-3 px-4 font-medium">Status</th>
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
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">No {tab} found</td></tr>
            ) : tab === 'services' ? (
              list.map((s: any) => (
                <tr key={s.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white font-medium">{s.title}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{s.user?.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{s.category || '—'}</td>
                  <td className="py-3 px-4 text-white">R {Number(s.price || 0).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.is_active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                    }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { if (confirm('Delete this service?')) deleteService.mutate(s.id); }}
                      className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              list.map((j: any) => (
                <tr key={j.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white font-medium">{j.title}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{j.client?.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{j.category || j.job_type || '—'}</td>
                  <td className="py-3 px-4 text-white">R {Number(j.budget || 0).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      j.status === 'open' ? 'bg-green-900/50 text-green-300' :
                      j.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                      j.status === 'completed' ? 'bg-gray-700 text-gray-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {j.status?.replace('_', ' ') || '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { if (confirm('Delete this job?')) deleteJob.mutate(j.id); }}
                      className="px-3 py-1 text-xs bg-red-900/50 hover:bg-red-800/50 text-red-300 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContentView;
