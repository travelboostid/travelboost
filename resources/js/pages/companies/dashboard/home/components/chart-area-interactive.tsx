import { formatIDR } from '@/lib/utils';
import { FormattedMessage } from 'react-intl';
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
        <div className="w-full p-4 sm:p-6">
            <div className="mb-6 px-1 sm:mb-8 sm:px-2">
                <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        <FormattedMessage defaultMessage="Revenue Analytics" />
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">
                        <FormattedMessage defaultMessage="Monthly trajectory over the current fiscal year" />
                    </p>
                </div>
            </div>
            <div className="h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="chartGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.3}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0}
                                />
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
                            tick={{
                                fill: '#94a3b8',
                                fontSize: 10,
                                fontWeight: 700,
                            }}
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
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#chartGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
