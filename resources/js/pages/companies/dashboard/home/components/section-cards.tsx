import { formatIDR } from '@/lib/utils';
import { TrendingUp, Users, Wallet } from 'lucide-react';

export function SectionCards({ stats, company }: any) {
  const metrics = [
    {
      label: 'Revenue',
      value: formatIDR(stats.sales?.total?.idr || 0),
      sub: `${stats.sales?.total?.pax || 0} Pax`,
      icon: <Wallet className="text-primary" size={20} />,
      color: 'bg-primary/10 dark:bg-primary/20',
    },
    {
      label: company.type === 'vendor' ? 'Profit' : 'Commission',
      value: formatIDR(stats.commission?.total || 0),
      sub: `MTD: ${formatIDR(stats.commission?.monthly || 0)}`,
      icon: <TrendingUp className="text-emerald-500" size={20} />,
      color: 'bg-emerald-50 dark:bg-emerald-500/10',
    },
    {
      label: 'Network',
      value: stats.counters?.customers || 0,
      sub: 'Active Customers',
      icon: <Users className="text-orange-500" size={20} />,
      color: 'bg-orange-50 dark:bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {metrics.map((m, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm flex items-center gap-6"
        >
          <div className={`p-4 rounded-2xl ${m.color}`}>{m.icon}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 mb-1">
              {m.label}
            </p>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
              {m.value}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
              {m.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
