import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

const StatCard = ({ label, value, loading }: { label: string; value: string | number; loading?: boolean }) => (
  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    {loading ? (
      <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
    ) : (
      <p className="text-2xl font-bold text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    )}
  </div>
);

const DashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminApi.getAnalytics(),
    refetchInterval: 30_000,
  });

  const metrics = [
    { label: 'Total Users', value: data?.totalUsers ?? '-' },
    { label: 'Verified Users', value: data?.verifiedUsers ?? '-' },
    { label: 'New Users (24h)', value: data?.newUsersToday ?? '-' },
    { label: 'Pending Verifications', value: data?.pendingVerifications ?? '-' },
    { label: 'Pending Withdrawals', value: data?.pendingWithdrawals ?? '-' },
    { label: 'Open Disputes', value: data?.openDisputes ?? '-' },
    { label: 'Total Transactions', value: data?.totalTransactions ?? '-' },
    { label: 'Completed TXNs', value: data?.completedTransactions ?? '-' },
    { label: 'Total Balance', value: data?.totalBalance ? `R ${Number(data.totalBalance).toLocaleString()}` : '-' },
    { label: 'Total Escrow', value: data?.totalEscrow ? `R ${Number(data.totalEscrow).toLocaleString()}` : '-' },
    { label: 'Transaction Volume', value: data?.transactionVolume ? `R ${Number(data.transactionVolume).toLocaleString()}` : '-' },
    { label: 'Active Services', value: data?.totalServices ?? '-' },
    { label: 'Open Jobs', value: data?.totalJobs ?? '-' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} loading={isLoading} />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
