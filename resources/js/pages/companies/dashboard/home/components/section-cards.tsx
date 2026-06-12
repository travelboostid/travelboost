import { formatIDR } from '@/lib/utils';
import { TrendingUp, Users, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

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

type MetricConfig = {
    key: string;
    label: React.ReactNode;
    value: string | number;
    isCurrency?: boolean;
    sub: React.ReactNode;
    icon: React.ReactNode;
    color: string;
    className?: string;
    control?: React.ReactNode;
};

export function SectionCards({ stats, company }: any) {
    const isVendor = company.type === 'vendor';
    const [revenuePeriod, setRevenuePeriod] = useState<'monthly' | 'yearly'>(
        'monthly',
    );
    const [commissionPeriod, setCommissionPeriod] = useState<
        'monthly' | 'yearly'
    >('monthly');

    const revenueValue = useMemo(() => {
        if (revenuePeriod === 'yearly') {
            return formatIDR(stats.sales?.yearly?.idr || 0);
        }

        return formatIDR(stats.sales?.monthly?.idr || 0);
    }, [revenuePeriod, stats.sales]);

    const revenueSubLabel =
        revenuePeriod === 'yearly' ? (
            <FormattedMessage defaultMessage="Current Year" />
        ) : (
            <FormattedMessage defaultMessage="Current Month" />
        );

    const periodToggle = (
        period: 'monthly' | 'yearly',
        setPeriod: (value: 'monthly' | 'yearly') => void,
    ) => (
        <div className="absolute top-4 right-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-700 dark:bg-slate-800">
            {(
                [
                    { value: 'monthly' as const, message: 'Month' as const },
                    { value: 'yearly' as const, message: 'Year' as const },
                ] as const
            ).map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => setPeriod(option.value)}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                        period === option.value
                            ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                >
                    {option.message === 'Month' ? (
                        <FormattedMessage defaultMessage="Month" />
                    ) : (
                        <FormattedMessage defaultMessage="Year" />
                    )}
                </button>
            ))}
        </div>
    );

    const metrics: MetricConfig[] = isVendor
        ? [
              {
                  key: 'revenue',
                  label: <FormattedMessage defaultMessage="Revenue" />,
                  value: revenueValue,
                  isCurrency: true,
                  sub: revenueSubLabel,
                  icon: <Wallet className="text-primary" size={16} />,
                  color: 'bg-primary/10 dark:bg-primary/20',
                  className: 'md:col-span-2',
                  control: periodToggle(revenuePeriod, setRevenuePeriod),
              },
              {
                  key: 'active-agents',
                  label: <FormattedMessage defaultMessage="Active Agents" />,
                  value: stats.counters?.active_agents || 0,
                  sub: (
                      <FormattedMessage defaultMessage="Registered Partners" />
                  ),
                  icon: <TrendingUp className="text-emerald-500" size={16} />,
                  color: 'bg-emerald-50 dark:bg-emerald-500/10',
                  className: 'md:col-span-1',
              },
              {
                  key: 'network',
                  label: <FormattedMessage defaultMessage="Network" />,
                  value: stats.counters?.customers || 0,
                  sub: <FormattedMessage defaultMessage="Active Customers" />,
                  icon: <Users className="text-orange-500" size={16} />,
                  color: 'bg-orange-50 dark:bg-orange-500/10',
                  className: 'md:col-span-1',
              },
          ]
        : [
              {
                  key: 'revenue',
                  label: <FormattedMessage defaultMessage="Revenue" />,
                  value: formatIDR(
                      revenuePeriod === 'yearly'
                          ? stats.sales?.yearly?.idr || 0
                          : stats.sales?.monthly?.idr || 0,
                  ),
                  isCurrency: true,
                  sub: revenueSubLabel,
                  icon: <Wallet className="text-primary" size={16} />,
                  color: 'bg-primary/10 dark:bg-primary/20',
                  className: 'md:col-span-2',
                  control: periodToggle(revenuePeriod, setRevenuePeriod),
              },
              {
                  key: 'commission',
                  label: <FormattedMessage defaultMessage="Commission" />,
                  value: formatIDR(
                      commissionPeriod === 'yearly'
                          ? stats.commission?.yearly || 0
                          : stats.commission?.monthly || 0,
                  ),
                  isCurrency: true,
                  sub:
                      commissionPeriod === 'yearly' ? (
                          <FormattedMessage defaultMessage="Current Year" />
                      ) : (
                          <FormattedMessage defaultMessage="Current Month" />
                      ),
                  icon: <TrendingUp className="text-emerald-500" size={16} />,
                  color: 'bg-emerald-50 dark:bg-emerald-500/10',
                  className: 'md:col-span-2',
                  control: periodToggle(commissionPeriod, setCommissionPeriod),
              },
              {
                  key: 'network',
                  label: <FormattedMessage defaultMessage="Network" />,
                  value: stats.counters?.customers || 0,
                  sub: <FormattedMessage defaultMessage="Active Customers" />,
                  icon: <Users className="text-orange-500" size={16} />,
                  color: 'bg-orange-50 dark:bg-orange-500/10',
                  className: 'md:col-span-1',
              },
          ];

    return (
        <div
            className={`grid grid-cols-1 gap-4 ${isVendor ? 'md:grid-cols-4' : 'md:grid-cols-5'}`}
        >
            {metrics.map((m) => (
                <div
                    key={m.key}
                    className={`relative flex min-w-0 items-center gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 ${m.className ?? ''} ${m.isCurrency ? 'min-h-[126px]' : 'min-h-[112px]'}`}
                >
                    {m.control}
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
                            <h3 className="break-all text-base font-bold leading-tight text-slate-900 tabular-nums dark:text-slate-100 sm:text-lg">
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
