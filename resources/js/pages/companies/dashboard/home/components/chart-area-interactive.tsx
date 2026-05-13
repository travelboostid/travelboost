import { formatIDR } from '@/lib/utils';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

export function ChartAreaInteractive({ data }: { data: any[] }) {
  return (
    <div className="w-full p-6">
      <div className="flex items-center justify-between mb-8 px-2">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Revenue Analytics
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
            Monthly trajectory over the current fiscal year
          </p>
        </div>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              dy={15}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgb(15 23 42)',
                borderRadius: '16px',
                border: 'none',
                padding: '12px',
              }}
              itemStyle={{
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
              labelStyle={{ display: 'none' }}
              formatter={(val: any) => [formatIDR(val)]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={4}
              fill="url(#chartGradient)"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
