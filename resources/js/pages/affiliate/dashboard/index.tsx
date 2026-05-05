import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
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
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AlertCircle, Bell, Clock, LockKeyhole, Wallet } from 'lucide-react';

dayjs.extend(relativeTime);

export default function AffiliateDashboardIndex({
  auth,
  wallet_balance = 0,
  tier = 'affiliate',
  stats = {},
  unreadNotificationsCount = 0,
  recentNotifications = [],
  recentAgents = [],
  networkPerformance = [],
}: any) {
  const user = auth?.user || { name: 'Affiliate Partner' };
  const profile = user?.affiliate_profile || user?.affiliateProfile;

  const isPendingApproval = profile?.status === 'pending';
  const isProfileIncomplete = !user?.phone || !profile?.address;
  const isMaster = tier === 'master_affiliate' || tier === 'master-affiliate';
  const isPartner = tier === 'partner';

  return (
    <AffiliateDashboardLayout
      activeMenuIds={['dashboard']}
      breadcrumb={[{ title: 'Dashboard', url: '/affiliate/dashboard' }]}
    >
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-0">
        {isPendingApproval && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <Card className="w-full max-w-lg shadow-2xl border-amber-200 bg-background/95 backdrop-blur-md p-8 text-center rounded-2xl mx-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <LockKeyhole className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                Account Pending Approval
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Your registration as an affiliate partner is currently in the
                review queue by your Network Partner. Dashboard access is
                temporarily locked until approved.
              </p>

              {isProfileIncomplete ? (
                <div className="bg-primary/10 border border-primary/20 p-5 rounded-xl text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-foreground">
                        Speed Up Verification!
                      </h4>
                      <p className="text-sm text-primary/80 mt-1 mb-4">
                        We detected that your profile is incomplete. Please fill
                        out your contact details and address to expedite the
                        process.
                      </p>
                      <Button
                        asChild
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      >
                        <Link href="/affiliate/dashboard/setup/profile">
                          Complete Profile Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted border border-border p-4 rounded-xl flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Your profile is complete. Please wait for approval.
                </div>
              )}
            </Card>
          </div>
        )}

        {!isPendingApproval && isProfileIncomplete && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-primary/10 border border-primary/20 p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">
                  Incomplete Profile
                </h3>
                <p className="text-sm text-primary/80 mt-1">
                  Please complete your personal details such as WhatsApp Number
                  and Address so your commissions can be processed without
                  issues.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              asChild
              className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href="/affiliate/dashboard/setup/profile">
                Complete Profile
              </Link>
            </Button>
          </div>
        )}

        <div
          className={`space-y-6 transition-all duration-300 ${isPendingApproval ? 'blur-[4px] opacity-40 pointer-events-none select-none grayscale-[30%]' : ''}`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
                Affiliate Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Welcome back,{' '}
                <span className="font-semibold text-slate-700">
                  {user.name}
                </span>
                !
              </p>
            </div>
            <div className="flex items-center gap-4 bg-slate-50 px-5 py-3 rounded-xl border border-slate-100">
              <div className="p-2.5 bg-white rounded-full text-primary shadow-sm border border-slate-100">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Wallet Balance
                </p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {formatIDR(wallet_balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {isPartner && (
              <>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      TOTAL NETWORK
                    </p>
                    <div className="flex-1 flex items-center">
                      <div className="grid grid-cols-2 w-full divide-x divide-slate-100">
                        <div className="pr-4">
                          <h3 className="text-3xl font-bold text-slate-800">
                            {stats.total_ma || 0}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Master Affiliates
                          </p>
                        </div>
                        <div className="pl-4">
                          <h3 className="text-3xl font-bold text-slate-800">
                            {stats.total_affiliate || 0}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Affiliators
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        All registered partners
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      AGENTS
                    </p>
                    <h3 className="text-3xl font-bold text-slate-800 flex-1 flex items-center">
                      {stats.total_agent || 0}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        Active agents from your networks
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {isMaster && (
              <>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      AFFILIATES STATUS
                    </p>
                    <div className="flex-1 flex items-center">
                      <div className="grid grid-cols-2 w-full divide-x divide-slate-100">
                        <div className="pr-4">
                          <h3 className="text-3xl font-bold text-slate-800">
                            {stats.total_affiliate_approved || 0}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium mt-1">
                            Active
                          </p>
                        </div>
                        <div className="pl-4">
                          <h3 className="text-3xl font-bold text-amber-600">
                            {stats.total_affiliate_pending || 0}
                          </h3>
                          <p className="text-[11px] text-amber-600 font-medium mt-1">
                            Pending Approvals
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        Total affiliates in your network
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      AGENT NETWORKS
                    </p>
                    <h3 className="text-3xl font-bold text-slate-800 flex-1 flex items-center">
                      {stats.total_agent || 0}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        Active agents from your networks
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {!isPartner && !isMaster && (
              <>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-2">
                      PENDING AGENTS
                    </p>
                    <h3 className="text-3xl font-bold text-amber-600 flex-1 flex items-center">
                      {stats.total_agent_pending || 0}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        Unpaid agent registrations
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      SUBSCRIBED AGENTS
                    </p>
                    <h3 className="text-3xl font-bold text-slate-800 flex-1 flex items-center">
                      {stats.total_agent_subscribed || 0}
                    </h3>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400">
                        Active and paid subscriptions
                      </p>
                    </div>
                  </div>
                </Card>
              </>
            )}

            <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full overflow-hidden relative">
              <div className="p-5 flex-1 flex flex-col relative z-10">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  EARNED COMMISSION
                </p>
                <h3 className="text-3xl font-bold text-primary flex-1 flex items-center">
                  {formatIDR(stats.total_commission || 0)}
                </h3>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400">
                    Total income over time
                  </p>
                </div>
              </div>
              <Wallet className="absolute right-[-10px] top-[15px] w-16 h-16 text-slate-50 rotate-[-10deg] z-0 pointer-events-none" />
            </Card>

            <Card className="shadow-sm border border-slate-100 bg-white flex flex-col h-full">
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    NOTIFICATIONS
                  </p>
                  <div className="relative">
                    <Bell className="h-4 w-4 text-slate-400" />
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 flex flex-col">
                  {recentNotifications?.length > 0 ? (
                    <div className="divide-y divide-slate-50 border-t border-slate-100 pt-2">
                      {recentNotifications.map((notif: any) => (
                        <div
                          key={notif.id}
                          className="py-2.5 flex items-start gap-3"
                        >
                          <div className="mt-1 shrink-0">
                            {!notif.read_at ? (
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-200" />
                            )}
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-medium text-slate-700 truncate">
                              {notif.data?.title ||
                                notif.data?.message ||
                                'System Notification'}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">
                              {dayjs(notif.created_at).format(
                                'DD MMMM YYYY, HH:mm',
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 border-t border-slate-100">
                      No new notifications.
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm border border-slate-100 overflow-hidden bg-white">
              <div className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Recent Registrations
                </CardTitle>
                <a
                  href="/affiliate/dashboard/agent/list"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10 px-6">
                      Agent Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10">
                      Package
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10 text-right px-6">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAgents.length > 0 ? (
                    recentAgents.map((agent: any) => (
                      <TableRow
                        key={agent.id}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="text-xs text-slate-700 font-medium px-6 py-3">
                          {agent.name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 py-3">
                          {agent.package}
                        </TableCell>
                        <TableCell className="text-right px-6 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-medium border-0 ${agent.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
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
                        className="text-center text-xs text-slate-400 py-8"
                      >
                        No recent registrations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>

            <Card className="shadow-sm border border-slate-100 overflow-hidden bg-white">
              <div className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4 px-6">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Network Performance
                </CardTitle>
                <a
                  href="/affiliate/dashboard/network/list"
                  className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  View all
                </a>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10 px-6">
                      Affiliate Name
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10">
                      Revenue
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-400 uppercase h-10 text-right px-6">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkPerformance.length > 0 ? (
                    networkPerformance.map((net: any, idx: number) => (
                      <TableRow
                        key={idx}
                        className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-medium text-xs text-slate-700 px-6 py-3">
                          {net.name}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-primary py-3">
                          {formatIDR(net.revenue)}
                        </TableCell>
                        <TableCell className="text-right px-6 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 font-medium border-0 ${net.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}
                          >
                            {net.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-xs text-slate-400 py-8"
                      >
                        No downlines network found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </AffiliateDashboardLayout>
  );
}
