import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ArrowUpRight, Bell, LayoutDashboard, Sparkles } from 'lucide-react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';
import SubscriptionAlert from './components/subscription-alert';

dayjs.extend(relativeTime);

const normalizeCurrency = (value: string) =>
    value.replace(/^Rp[\s\u00a0]*/i, '');

const getCurrencyTextClass = (value: string, base = 'text-xl') => {
    const digits = normalizeCurrency(value).replace(/\D/g, '').length;

    if (digits >= 16) return 'text-xs sm:text-sm';
    if (digits >= 13) return 'text-sm sm:text-base';
    if (digits >= 10) return 'text-base sm:text-lg';

    return base;
};

function CurrencyAmount({
    value,
    valueClassName = 'text-xl font-bold text-slate-900 dark:text-slate-100',
    prefixClassName = 'text-sm font-semibold text-slate-500 dark:text-slate-400',
    baseSize = 'text-xl',
}: {
    value: string;
    valueClassName?: string;
    prefixClassName?: string;
    baseSize?: string;
}) {
    const normalizedValue = normalizeCurrency(value);

    return (
        <div className="flex min-w-0 items-baseline gap-1.5 overflow-hidden">
            <span className={`shrink-0 ${prefixClassName}`}>Rp</span>
            <span
                className={`min-w-0 break-all leading-tight tabular-nums ${valueClassName} ${getCurrencyTextClass(value, baseSize)}`}
            >
                {normalizedValue}
            </span>
        </div>
    );
}

export default function Home() {
    const {
        company,
        stats,
        chartData,
        topDestinations: _topDestinations,
        topAgents: _topAgents,
        recentNotifications = [],
        unreadNotificationsCount = 0,
    } = usePageProps<any>();

    return (
        <CompanyDashboardLayout
            activeMenuIds={[`home`]}
            breadcrumb={[{ title: 'Dashboard' }]}
            containerClassName="bg-slate-50/30 dark:bg-slate-950 min-h-screen"
        >
            <Head title="Dashboard" />
            <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                            <h1 className="text-3xl font-bold tracking-tight text-slate-4000 dark:text-slate-100">
                                Dashboard
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 flex min-w-0 items-center gap-2">
                                <LayoutDashboard size={14} /> Global performance
                                analytics for{' '}
                                <span className="truncate">{company.name}</span>
                            </p>
                        </div>
                        <div className="flex w-full items-start justify-between gap-3 md:w-auto md:items-center md:justify-end">
                            <div className="flex min-w-0 flex-1 flex-col md:flex-none md:items-end">
                                <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                                    Wallet Balance
                                </span>
                                <CurrencyAmount
                                    value={formatIDR(
                                        stats.wallet?.balance || 0,
                                    )}
                                    valueClassName="font-bold text-slate-900 dark:text-slate-100"
                                    baseSize="text-xl"
                                />
                                <Link
                                    href={`/companies/${company.username}/dashboard/withdrawals`}
                                    className="mt-2 inline-flex w-fit items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                >
                                    Withdrawal
                                    <ArrowUpRight size={13} />
                                </Link>
                            </div>
                            <Link
                                href={`/companies/${company.username}/dashboard/notifications`}
                                className="relative shrink-0 rounded-full bg-white p-2.5 shadow-sm ring-1 ring-slate-200 transition-all hover:ring-2 hover:ring-primary/20 dark:bg-slate-900 dark:ring-slate-800"
                            >
                                <Bell
                                    size={20}
                                    className="text-slate-600 dark:text-slate-400"
                                />
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 text-[10px] font-bold text-white flex items-center justify-center">
                                        {unreadNotificationsCount}
                                    </span>
                                )}
                            </Link>
                        </div>
                    </header>

                    {company.type === 'agent' && <SubscriptionAlert />}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                        <div className="space-y-6 min-w-0 lg:col-span-3">
                            <SectionCards stats={stats} company={company} />
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                                <ChartAreaInteractive data={chartData} />
                            </div>
                        </div>

                        <div className="space-y-6 min-w-0">
                            <Card className="relative overflow-hidden rounded-3xl bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800">
                                <div className="absolute -right-6 -bottom-8 text-primary opacity-10">
                                    <Sparkles size={104} />
                                </div>
                                <CardContent className="relative p-6 py-2">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <div className="shrink-0 rounded-2xl bg-primary/10 p-3 text-primary dark:bg-primary/20">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                                                AI Credit
                                            </span>
                                            <div className="mt-1">
                                                <CurrencyAmount
                                                    value={formatIDR(
                                                        stats.ai_credit || 0,
                                                    )}
                                                    valueClassName="font-bold text-slate-900 dark:text-slate-100"
                                                    prefixClassName="text-sm font-semibold text-slate-500 dark:text-slate-400"
                                                    baseSize="text-xl"
                                                />
                                            </div>
                                            <p className="mt-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                Available Credits
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/companies/${company.username}/dashboard/${company.type === 'agent' ? 'chatbot' : 'ai-credits'}`}
                                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                                    >
                                        Top Up
                                        <ArrowUpRight size={14} />
                                    </Link>
                                </CardContent>
                            </Card>

                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                    Notification
                                    <Link
                                        href={`/companies/${company.username}/dashboard/notifications`}
                                        className="text-xs text-primary hover:underline"
                                    >
                                        View All
                                    </Link>
                                </h4>
                                <div className="mt-6 space-y-5">
                                    {recentNotifications
                                        .slice(0, 5)
                                        .map((notif: any) => (
                                            <div
                                                key={notif.id}
                                                className="flex gap-4 group cursor-default"
                                            >
                                                <div className="w-1 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                                        {notif.data?.title ||
                                                            notif.data?.message}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-tighter font-medium">
                                                        {dayjs(
                                                            notif.created_at,
                                                        ).fromNow()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
