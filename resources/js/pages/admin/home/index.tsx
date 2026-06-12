import AdminDashboardLayout from '@/components/layouts/admin-dashboard';
import { formatIDR } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
    BanknoteIcon,
    Building2Icon,
    HandshakeIcon,
    ImageIcon,
    LandmarkIcon,
    LoaderCircleIcon,
    LuggageIcon,
    ShoppingBagIcon,
    TicketIcon,
    TrendingDownIcon,
    TrendingUpIcon,
    UsersIcon,
} from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts';

type AdminDashboardData = {
    totals: {
        users: number;
        companies: number;
        vendors: number;
        agents: number;
        affiliates: number;
        tours: number;
        bookings: number;
        media: number;
    };
    pendingWithdrawalsCount: number;
    pendingPaymentsCount: number;
    totalRevenue: number;
    monthlyRevenue: number;
    recentUsers: Array<{
        id: number;
        name: string;
        email: string;
        photo_url: string | null;
        created_at: string;
    }>;
    recentCompanies: Array<{
        id: number;
        name: string;
        type: string;
        username: string;
        created_at: string;
    }>;
    chartData: Array<{
        month: string;
        revenue: number;
        bookings: number;
    }>;
};

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    isCurrency,
    trend,
    href,
}: {
    label: string;
    value: string | number;
    icon: typeof UsersIcon;
    color: string;
    isCurrency?: boolean;
    trend?: { value: number; positive: boolean };
    href?: string;
}) {
    const content = (
        <div className="group relative flex min-w-0 items-center gap-4 rounded-3xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
            <div
                className={`shrink-0 rounded-2xl p-3 ${color} transition-transform group-hover:scale-105`}
            >
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {label}
                </p>
                <h3 className="break-all text-lg font-bold leading-tight tabular-nums text-foreground sm:text-xl">
                    {isCurrency
                        ? formatIDR(Number(value))
                        : typeof value === 'number'
                          ? value.toLocaleString('id-ID')
                          : value}
                </h3>
                {trend && (
                    <div className="mt-1.5 flex items-center gap-1">
                        {trend.positive ? (
                            <TrendingUpIcon className="size-3.5 text-emerald-500" />
                        ) : (
                            <TrendingDownIcon className="size-3.5 text-destructive" />
                        )}
                        <span
                            className={`text-xs font-semibold ${trend.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}
                        >
                            {trend.value}%
                        </span>
                    </div>
                )}
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}

function RecentList({
    title,
    items,
    type,
    getHref,
}: {
    title: string;
    items: any[];
    type: 'users' | 'companies';
    getHref?: (item: any) => string;
}) {
    return (
        <div className="rounded-2xl border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
                <h3 className="text-sm font-semibold text-foreground">
                    {title}
                </h3>
            </div>
            <div className="divide-y divide-border">
                {items.map((item) => {
                    const href = getHref?.(item);
                    const row = (
                        <div
                            key={item.id}
                            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                        >
                            {type === 'users' ? (
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {item.name.charAt(0).toUpperCase()}
                                </div>
                            ) : (
                                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                    {item.name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-foreground">
                                    {item.name}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {type === 'users'
                                        ? item.email
                                        : `${item.type} · ${item.username}`}
                                </p>
                            </div>
                            <span className="shrink-0 text-xs text-muted-foreground">
                                {item.created_at}
                            </span>
                        </div>
                    );

                    return href ? (
                        <Link key={item.id} href={href}>
                            {row}
                        </Link>
                    ) : (
                        row
                    );
                })}
            </div>
        </div>
    );
}

export default function Home({
    totals,
    pendingWithdrawalsCount,
    pendingPaymentsCount,
    totalRevenue,
    monthlyRevenue,
    recentUsers,
    recentCompanies,
    chartData,
}: AdminDashboardData) {
    const d = {
        totals,
        pendingWithdrawalsCount,
        pendingPaymentsCount,
        totalRevenue,
        monthlyRevenue,
        recentUsers,
        recentCompanies,
        chartData,
    };

    return (
        <AdminDashboardLayout
            activeMenuIds={['dashboard']}
            breadcrumb={[{ title: 'Dashboard' }]}
        >
            <Head title="Admin Dashboard" />

            <div className="mx-auto w-full space-y-6 p-4 sm:p-6">
                {/* Header */}
                <header>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        <FormattedMessage defaultMessage="Dashboard" />
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        <FormattedMessage defaultMessage="Platform overview at a glance" />
                    </p>
                </header>

                {/* Revenue + Pending Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        label="Total Revenue"
                        value={d.totalRevenue}
                        icon={LandmarkIcon}
                        color="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        isCurrency
                    />
                    <StatCard
                        label="Monthly Revenue"
                        value={d.monthlyRevenue}
                        icon={TrendingUpIcon}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        isCurrency
                    />
                    <StatCard
                        label="Pending Withdrawals"
                        value={d.pendingWithdrawalsCount}
                        icon={LoaderCircleIcon}
                        color="bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                        href="/admin/funds/withdrawals"
                    />
                    <StatCard
                        label="Pending Payments"
                        value={d.pendingPaymentsCount}
                        icon={BanknoteIcon}
                        color="bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        href="/admin/funds/payments"
                    />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
                    <StatCard
                        label="Users"
                        value={d.totals.users}
                        icon={UsersIcon}
                        color="bg-primary/10 text-primary"
                        href="/admin/database/users"
                    />
                    <StatCard
                        label="Companies"
                        value={d.totals.companies}
                        icon={Building2Icon}
                        color="bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400"
                        href="/admin/database/vendors"
                    />
                    <StatCard
                        label="Vendors"
                        value={d.totals.vendors}
                        icon={HandshakeIcon}
                        color="bg-teal-100 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400"
                        href="/admin/database/vendors"
                    />
                    <StatCard
                        label="Agents"
                        value={d.totals.agents}
                        icon={ShoppingBagIcon}
                        color="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                        href="/admin/database/agents"
                    />
                    <StatCard
                        label="Affiliates"
                        value={d.totals.affiliates}
                        icon={UsersIcon}
                        color="bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400"
                        href="/admin/database/affiliates"
                    />
                    <StatCard
                        label="Tours"
                        value={d.totals.tours}
                        icon={TicketIcon}
                        color="bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400"
                        href="/admin/tours/products"
                    />
                    <StatCard
                        label="Bookings"
                        value={d.totals.bookings}
                        icon={LuggageIcon}
                        color="bg-pink-100 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400"
                        href="/admin/tours/orders"
                    />
                    <StatCard
                        label="Media"
                        value={d.totals.media}
                        icon={ImageIcon}
                        color="bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400"
                        href="/admin/database/medias"
                    />
                </div>

                {/* Chart + Recent Lists */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
                    {/* Revenue Chart */}
                    <div className="rounded-2xl border bg-card shadow-sm">
                        <div className="border-b border-border px-6 py-5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    <TrendingUpIcon className="size-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Revenue & Bookings Trend
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        12-month view
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="h-[280px] sm:h-[320px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={d.chartData}
                                        margin={{
                                            top: 10,
                                            right: 10,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="revenueGradient"
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
                                            <linearGradient
                                                id="bookingsGradient"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#f59e0b"
                                                    stopOpacity={0.2}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#f59e0b"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="4 4"
                                            vertical={false}
                                            stroke="currentColor"
                                            className="text-border/50"
                                        />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fill: '#94a3b8',
                                                fontSize: 11,
                                                fontWeight: 600,
                                            }}
                                            dy={10}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor:
                                                    'hsl(var(--popover))',
                                                borderRadius: '12px',
                                                border: '1px solid hsl(var(--border))',
                                                padding: '10px 14px',
                                                fontSize: '12px',
                                                boxShadow:
                                                    '0 4px 12px rgba(0,0,0,0.08)',
                                            }}
                                            labelStyle={{
                                                fontWeight: 600,
                                                marginBottom: 4,
                                                color: 'hsl(var(--foreground))',
                                            }}
                                            formatter={(
                                                val: any,
                                                name: string,
                                            ) => [
                                                name === 'revenue'
                                                    ? formatIDR(val)
                                                    : val,
                                                name === 'revenue'
                                                    ? 'Revenue'
                                                    : 'Bookings',
                                            ]}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3b82f6"
                                            strokeWidth={2.5}
                                            fill="url(#revenueGradient)"
                                            dot={{
                                                r: 3,
                                                fill: '#3b82f6',
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{
                                                r: 5,
                                                strokeWidth: 0,
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="bookings"
                                            stroke="#f59e0b"
                                            strokeWidth={2.5}
                                            fill="url(#bookingsGradient)"
                                            dot={{
                                                r: 3,
                                                fill: '#f59e0b',
                                                strokeWidth: 2,
                                                stroke: '#fff',
                                            }}
                                            activeDot={{
                                                r: 5,
                                                strokeWidth: 0,
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="space-y-6">
                        <RecentList
                            title="Recent Users"
                            items={d.recentUsers}
                            type="users"
                            getHref={(user) =>
                                `/admin/database/users/${user.id}/edit`
                            }
                        />
                        <RecentList
                            title="Recent Companies"
                            items={d.recentCompanies}
                            type="companies"
                            getHref={(company) =>
                                `/admin/database/${company.type}s/${company.id}/edit`
                            }
                        />
                    </div>
                </div>
            </div>
        </AdminDashboardLayout>
    );
}
