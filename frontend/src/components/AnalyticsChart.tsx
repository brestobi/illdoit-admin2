import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/adminApi';

const AnalyticsChart = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => adminApi.getAnalytics(),
  });

  if (isLoading) return <div>Loading Analytics...</div>;

  const chartData = data?.dailyRevenue || [];

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Revenue (Last 7 Days)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" tickFormatter={(value) => `R${value}`} />
            <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} 
                formatter={(value: any) => [`R${Number(value).toLocaleString()}`, 'Revenue']}
            />
            <Line type="monotone" dataKey="value" name="Revenue" stroke="#10B981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;
