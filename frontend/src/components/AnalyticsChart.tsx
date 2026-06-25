import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

const AnalyticsChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminApi.getAnalytics(),
  });

  if (isLoading) return <div>Loading Analytics...</div>;

  // Transform data for the chart if necessary
  // Assuming API returns an array like [{date: '2025-06-01', value: 10}, ...]
  const chartData = data?.dailyVolume || [];

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Volume</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
            <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
