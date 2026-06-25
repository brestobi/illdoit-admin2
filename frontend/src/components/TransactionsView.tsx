import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';
import { useState } from 'react';

const TransactionsView = () => {
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: transactions, isLoading: txnLoading } = useQuery({
    queryKey: ['transactions', typeFilter, statusFilter],
    queryFn: () => adminApi.getTransactions(typeFilter || undefined, statusFilter || undefined),
  });

  const { data: payments, isLoading: payLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => adminApi.getPayments(),
  });

  const [tab, setTab] = useState<'transactions' | 'payments'>('transactions');
  const list = tab === 'transactions' ? (transactions ?? []) : (payments ?? []);

  const typeOptions = ['', 'deposit', 'withdrawal', 'escrow', 'escrow_release', 'payment'];
  const statusOptions = ['', 'pending', 'completed', 'cancelled'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Transactions & Payments</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('transactions')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'transactions' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => setTab('payments')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'payments' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700'
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {tab === 'transactions' && (
        <div className="flex gap-3 mb-6">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All types</option>
            {typeOptions.slice(1).map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All statuses</option>
            {statusOptions.slice(1).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              {tab === 'transactions' ? (
                <>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Sender</th>
                  <th className="py-3 px-4 font-medium">Receiver</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </>
              ) : (
                <>
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Reference</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {(txnLoading || payLoading) ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  {Array.from({ length: tab === 'transactions' ? 6 : 5 }).map((_, j) => (
                    <td key={j} className="py-3 px-4"><div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : list.length === 0 ? (
              <tr><td colSpan={tab === 'transactions' ? 6 : 5} className="py-8 text-center text-gray-500">No records found</td></tr>
            ) : tab === 'transactions' ? (
              list.map((t: any) => (
                <tr key={t.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4">
                    <span className="text-white capitalize">{t.type?.replace('_', ' ')}</span>
                  </td>
                  <td className="py-3 px-4 text-white font-medium">R {Number(t.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{t.sender?.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-300 text-sm">{t.receiver?.email || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      t.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                      t.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(t.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              list.map((p: any) => (
                <tr key={p.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="py-3 px-4 text-white">{p.user?.email || '—'}</td>
                  <td className="py-3 px-4 text-white font-medium">R {Number(p.amount).toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm font-mono">{p.reference?.slice(0, 16) || '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      p.status === 'successful' ? 'bg-green-900/50 text-green-300' :
                      p.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-sm">
                    {new Date(p.created_at).toLocaleDateString()}
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

export default TransactionsView;
