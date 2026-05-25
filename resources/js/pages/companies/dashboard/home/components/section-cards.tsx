import { formatIDR } from '@/lib/utils';
import { TrendingUp, Users, Wallet } from 'lucide-react';

const normalizeCurrency = (value: string) =>
    value.replace(/^Rp[\s\u00a0]*/i, '');

const getCurrencyTextClass = (value: string) => {
    const digits = normalizeCurrency(value).replace(/\D/g, '').length;

    if (digits >= 16) return 'text-xs sm:text-sm';
    if (digits >= 13) return 'text-sm sm:text-base';
    if (digits >= 10) return 'text-base sm:text-lg';

    return 'text-lg sm:text-xl';
};

function CurrencyAmount({ value }: { value: string }) {
    const normalizedValue = normalizeCurrency(value);

    return (
        <div className="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
            <span className="shrink-0 text-sm font-semibold text-slate-500 dark:text-slate-400">
                Rp
            </span>
            <span
                className={`min-w-0 break-all font-bold leading-tight text-slate-900 tabular-nums dark:text-slate-100 ${getCurrencyTextClass(value)}`}
            >
                {normalizedValue}
            </span>
        </div>
    );
}

export function SectionCards({ stats, company }: any) {
    const metrics = [
        {
            label: 'Revenue',
            value: formatIDR(stats.sales?.total?.idr || 0),
            isCurrency: true,
            sub: `${stats.sales?.total?.pax || 0} Pax`,
            icon: <Wallet className="text-primary" size={16} />,
            color: 'bg-primary/10 dark:bg-primary/20',
        },
        {
            label: company.type === 'vendor' ? 'Profit' : 'Commission',
            value: formatIDR(stats.commission?.total || 0),
            isCurrency: true,
            sub: `MTD: ${formatIDR(stats.commission?.monthly || 0)}`,
            icon: <TrendingUp className="text-emerald-500" size={16} />,
            color: 'bg-emerald-50 dark:bg-emerald-500/10',
        },
        {
            label: 'Network',
            value: stats.counters?.customers || 0,
            sub: 'Active Customers',
            icon: <Users className="text-orange-500" size={16} />,
            color: 'bg-orange-50 dark:bg-orange-500/10',
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {metrics.map((m, i) => (
                <div
                    key={i}
                    className="flex min-w-0 items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                >
                    <div className={`shrink-0 rounded-2xl p-3 ${m.color}`}>
                        {m.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                            {m.label}
                        </p>
                        {m.isCurrency ? (
                            <CurrencyAmount value={String(m.value)} />
                        ) : (
                            <h3 className="break-all text-lg font-bold leading-tight text-slate-900 tabular-nums dark:text-slate-100 sm:text-xl">
                                {m.value}
                            </h3>
                        )}
                        <p className="mt-1.5 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                            {m.sub}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
