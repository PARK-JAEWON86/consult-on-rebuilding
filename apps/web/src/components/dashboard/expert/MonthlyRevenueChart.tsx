'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyRevenueData {
  month: string;
  revenue: number;
  sessionCount: number;
}

interface MonthlyRevenueChartProps {
  data: MonthlyRevenueData[];
}

export default function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const formatCurrency = (value: number) => {
    return `₩${(value / 10000).toFixed(0)}만`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">월별 매출 추이</h2>
        <p className="text-sm text-gray-600 mt-1">최근 12개월간의 매출과 상담 건수</p>
      </div>

      {/* Revenue Line Chart */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-700 mb-3">매출 추이</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={formatCurrency}
            />
            <Tooltip
              formatter={(value: number) => [`₩${value.toLocaleString('ko-KR')}`, '매출']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Session Count Bar Chart */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">상담 건수</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip
              formatter={(value: number) => [`${value}건`, '상담 건수']}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar
              dataKey="sessionCount"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">총 매출</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">총 상담 건수</p>
          <p className="text-xl font-bold text-gray-900">
            {data.reduce((sum, item) => sum + item.sessionCount, 0)}건
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">평균 상담료</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              data.reduce((sum, item) => sum + item.revenue, 0) /
              Math.max(data.reduce((sum, item) => sum + item.sessionCount, 0), 1)
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
