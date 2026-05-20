import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatIDR } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Clock3,
  LayoutDashboard,
  LockKeyhole,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';

type DashboardProps = {
  auth: any;
  wallet_balance?: number;
  tier?: string;
  stats?: Record<string, number>;
  unreadNotificationsCount?: number;
  recentAgents?: any[];
  networkPerformance?: any[];
};

const getResponsiveAmountClass = (value: string | number) => {
  const length = String(value).length;

  if (length >= 20) {
    return 'text-lg sm:text-xl';
  }

  if (length >= 16) {
    return 'text-xl sm:text-2xl';
  }

  if (length >= 12) {
    return 'text-2xl';
  }

  return 'text-2xl sm:text-3xl';
};

export default function AffiliateDashboardIndex({
  auth,
  wallet_balance = 0,
  tier = 'affiliate',
  stats = {},
  unreadNotificationsCount = 0,
  recentAgents = [],
  networkPerformance = [],
}: DashboardProps) {
  const user = auth?.user || { name: 'Affiliate Partner' };
  const profile = user?.affiliate_profile || user?.affiliateProfile;

  const isPendingApproval = profile?.status === 'pending';
  const isProfileIncomplete = !user?.phone || !profile?.address;
  const isMaster = tier === 'master_affiliate' || tier === 'master-affiliate';
  const isPartner = tier === 'partner';

  const tierLabel = isPartner
    ? 'Partner'
    : isMaster
      ? 'Master Affiliate'
      : 'Affiliate';

  const performanceCards = isPartner
    ? [
        {
          title: 'Master Affiliates',
          value: stats.total_ma || 0,
          description: 'Approved network leaders.',
          icon: Users,
        },
        {
          title: 'Affiliates',
          value: stats.total_affiliate || 0,
          description: 'Approved affiliators.',
          icon: UserCheck,
        },
        {
          title: 'Agents',
          value: stats.total_agent || 0,
          description: 'Registered agents.',
          icon: BriefcaseBusiness,
        },
      ]
    : isMaster
      ? [
          {
            title: 'Active Affiliates',
            value: stats.total_affiliate_approved || 0,
            description: 'Approved affiliators.',
            icon: UserCheck,
          },
          {
            title: 'Pending Approvals',
            value: stats.total_affiliate_pending || 0,
            description: 'Waiting for review.',
            icon: Clock3,
          },
          {
            title: 'Agent Networks',
            value: stats.total_agent || 0,
            description: 'Agents in your network.',
            icon: BriefcaseBusiness,
          },
        ]
      : [
          {
            title: 'Pending Agents',
            value: stats.total_agent_pending || 0,
            description: 'Awaiting subscription.',
            icon: Clock3,
          },
          {
            title: 'Subscribed Agents',
            value: stats.total_agent_subscribed || 0,
            description: 'Active subscribed agents.',
            icon: UserCheck,
          },
        ];

  const summaryCards = [
    ...performanceCards,
    {
      title: 'Earned Commission',
      value: formatIDR(stats.total_commission || 0),
      description: 'Total commission earned.',
      icon: Wallet,
      isCurrency: true,
    },
  ];

  const displayedRecentAgents = recentAgents.slice(0, 5);
  const displayedNetworkPerformance = networkPerformance.slice(0, 5);
  const statsGridClass =
    summaryCards.length === 3
      ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4';

  return (
    <AffiliateDashboardLayout
      activeMenuIds={['dashboard']}
      breadcrumb={[{ title: 'Dashboard', url: '/affiliate/dashboard' }]}
      containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
    >
      <Head title="Dashboard" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        {isPendingApproval && (
          <div className="absolute inset-0 z-20 flex items-start justify-center rounded-[2rem] bg-slate-950/10 px-4 py-10 backdrop-blur-sm">
            <Card className="w-full max-w-xl rounded-3xl border-none bg-white/95 py-0 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900/95 dark:ring-slate-800">
              <CardContent className="p-8 text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
                  <LockKeyhole className="h-9 w-9" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                  Account Pending Approval
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Your affiliate registration is currently being reviewed by
                  your network leader. Dashboard access remains limited until
                  the approval process is completed.
                </p>

                {isProfileIncomplete ? (
                  <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Complete your profile to speed up verification
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Add your phone number and full address so the team
                            can validate your account faster.
                          </p>
                        </div>
                        <Button asChild className="w-full rounded-xl">
                          <Link href="/affiliate/dashboard/setup/profile">
                            Complete Profile
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-normal text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Your profile is complete. Please wait while the review is
                    finalized.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div
          className={`space-y-8 transition-all duration-300 ${
            isPendingApproval
              ? 'pointer-events-none select-none opacity-40 blur-[4px]'
              : ''
          }`}
        >
          {isProfileIncomplete && !isPendingApproval && (
            <Card className="rounded-3xl border-none bg-amber-50 py-0 shadow-sm ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      Your profile still needs a few details
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Complete your phone number and address so commission and
                      verification processes can run smoothly.
                    </p>
                  </div>
                </div>
                <Button asChild className="rounded-xl">
                  <Link href="/affiliate/dashboard/setup/profile">
                    Complete Profile
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <section>
            <Card className="overflow-hidden rounded-3xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <CardContent className="bg-gradient-to-br from-white via-slate-50 to-slate-100 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary hover:bg-primary/10 dark:bg-primary/15">
                        {tierLabel}
                      </Badge>
                      <Badge
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          isPendingApproval
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300'
                        }`}
                      >
                        {isPendingApproval ? 'Pending Approval' : 'Active'}
                      </Badge>
                    </div>

                    <div className="mt-5">
                      <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Affiliate Dashboard
                      </h1>
                      <p className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <LayoutDashboard className="h-4 w-4" />
                        Track your network, agent activity, and commission in
                        one place.
                      </p>
                      <p className="mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                        Welcome back,{' '}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {user.name}
                        </span>
                        . Review your key metrics, monitor new registrations,
                        and follow subscription conversion across your network.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900/80 dark:ring-slate-800">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Wallet Balance
                        </span>
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <p
                        className={`mt-3 break-words font-semibold leading-tight text-slate-900 dark:text-slate-100 ${getResponsiveAmountClass(formatIDR(wallet_balance))}`}
                      >
                        {formatIDR(wallet_balance)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Current available balance.
                      </p>
                    </div>

                    <Link
                      href="/affiliate/dashboard/notifications"
                      className="group block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:ring-primary/30 dark:bg-slate-900/80 dark:ring-slate-800 dark:hover:ring-primary/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            Notification
                          </span>
                          {unreadNotificationsCount > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-600 dark:bg-red-500/15 dark:text-red-300">
                              <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                              </span>
                              New
                            </span>
                          )}
                        </div>
                        <Bell className="h-5 w-5 text-primary transition-transform group-hover:scale-105" />
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                        {unreadNotificationsCount}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Open your latest notifications.
                      </p>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className={statsGridClass}>
            {summaryCards.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.title}
                  className="rounded-3xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                          {item.title}
                        </p>
                        <p
                          className={`mt-4 break-words font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100 ${
                            item.isCurrency
                              ? getResponsiveAmountClass(item.value)
                              : 'text-3xl'
                          }`}
                        >
                          {item.value}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card className="overflow-hidden rounded-3xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Recent Registrations
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    The newest agents added through your affiliate network.
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start rounded-xl px-0 text-primary hover:bg-transparent hover:text-primary/80"
                >
                  <Link href="/affiliate/dashboard/agent/list">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent dark:border-slate-800">
                      <TableHead className="px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Agent Name
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Package
                      </TableHead>
                      <TableHead className="px-6 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRecentAgents.length > 0 ? (
                      displayedRecentAgents.map((agent: any) => (
                        <TableRow
                          key={agent.id}
                          className="border-slate-100 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {agent.name}
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-500 dark:text-slate-400">
                            {agent.package}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge
                              variant="outline"
                              className={`rounded-full border-0 px-3 py-1 text-[11px] font-semibold ${
                                agent.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              }`}
                            >
                              {agent.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          No recent registrations found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="overflow-hidden rounded-3xl border-none bg-white py-0 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/40 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Affiliator Performance
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Subscription conversion across your affiliator network.
                  </p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  className="justify-start rounded-xl px-0 text-primary hover:bg-transparent hover:text-primary/80"
                >
                  <Link href="/affiliate/dashboard/network/list">
                    View all
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-100 hover:bg-transparent dark:border-slate-800">
                      <TableHead className="px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Affiliator Name
                      </TableHead>
                      <TableHead className="min-w-[220px] text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Conversion
                      </TableHead>
                      <TableHead className="px-6 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedNetworkPerformance.length > 0 ? (
                      displayedNetworkPerformance.map((network: any) => (
                        <TableRow
                          key={`${network.name}-${network.status}`}
                          className="border-slate-100 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {network.name}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-2.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-800">
                                <div
                                  className="h-2.5 rounded-full bg-primary"
                                  style={{
                                    width: `${Math.min(network.conversion || 0, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="w-12 text-right text-sm font-medium text-slate-700 dark:text-slate-300">
                                {Math.round(network.conversion || 0)}%
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              {network.subscribed_agents || 0} subscribed of{' '}
                              {network.total_agents || 0} total agents
                            </p>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Badge
                              variant="outline"
                              className={`rounded-full border-0 px-3 py-1 text-[11px] font-semibold ${
                                network.status === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300'
                              }`}
                            >
                              {network.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                        >
                          No affiliator performance data found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </section>
        </div>
      </div>
    </AffiliateDashboardLayout>
  );
}
