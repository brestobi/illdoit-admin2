import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const CONFIG_TABLES = [
  { key: 'categories', label: 'Categories' },
  { key: 'skills', label: 'Skills' },
  { key: 'locations', label: 'Locations' },
  { key: 'id_types', label: 'ID Types' },
  { key: 'supported_banks', label: 'Supported Banks' },
  { key: 'report_reasons', label: 'Report Reasons' },
  { key: 'dispute_reasons', label: 'Dispute Reasons' },
];

const ConfigView = () => {
  const [activeTable, setActiveTable] = useState('categories');
  const [addModal, setAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const queryClient = useQueryClient();

  const { data: entries, isLoading } = useQuery({
    queryKey: ['config', activeTable],
    queryFn: () => adminApi.getConfigTable(activeTable),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => adminApi.addConfigEntry(activeTable, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', activeTable] });
      setAddModal(false);
      setFormData({});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.updateConfigEntry(activeTable, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', activeTable] });
      setEditEntry(null);
      setFormData({});
    },
  });

  const list = entries ?? [];

  // Determine columns from first entry
  const columns = list.length > 0
    ? Object.keys(list[0]).filter((k) => k !== 'id')
    : ['name', 'is_active'];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">Reference Data</h2>
        <div className="flex flex-wrap gap-2">
          {CONFIG_TABLES.map((t) => (
            <button
              key={t.key}
              onClick={() => { setActiveTable(t.key); setEditEntry(null); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTable === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <p className="text-sm text-gray-400">{list.length} entries</p>
          <button
            onClick={() => { setAddModal(true); setFormData({ name: '', is_active: true }); }}
            className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            + Add Entry
          </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              {columns.map((col) => (
                <th key={col} className="py-3 px-4 font-medium capitalize">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
              <th className="py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {columns.map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" /></td>
                  ))}
                  <td className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-12 animate-pulse" /></td>
                </tr>
              ))
            ) : list.length === 0 ? (
              <tr><td colSpan={columns.length + 1} className="py-8 text-center text-gray-500">No entries</td></tr>
            ) : (
              list.map((entry: any) => (
                <tr key={entry.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  {columns.map((col) => (
                    <td key={col} className="py-3 px-4">
                      {col === 'is_active' || col === 'is_verified' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          entry[col] ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                        }`}>
                          {entry[col] ? 'Active' : 'Inactive'}
                        </span>
                      ) : (
                        <span className="text-white text-sm">{String(entry[col] ?? '—')}</span>
                      )}
                    </td>
                  ))}
                  <td className="py-3 px-4">
                    <button
                      onClick={() => { setEditEntry(entry); setFormData({ ...entry }); }}
                      className="px-3 py-1 text-xs bg-blue-900/50 hover:bg-blue-800/50 text-blue-300 rounded transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {(addModal || editEntry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setAddModal(false); setEditEntry(null); setFormData({}); }}>
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">
              {editEntry ? 'Edit Entry' : 'Add Entry'}
            </h3>

            <div className="space-y-4">
              {columns.map((col) => (
                <div key={col}>
                  <label className="block text-sm text-gray-400 mb-1 capitalize">
                    {col.replace(/_/g, ' ')}
                  </label>
                  {col === 'is_active' ? (
                    <select
                      value={formData[col] ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value === 'true' })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[col] ?? ''}
                      onChange={(e) => setFormData({ ...formData, [col]: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setAddModal(false); setEditEntry(null); setFormData({}); }}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (editEntry) {
                    updateMutation.mutate({ id: editEntry.id, data: formData });
                  } else {
                    addMutation.mutate(formData);
                  }
                }}
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                {editEntry ? 'Save Changes' : 'Add Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigView;
