import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';
import SubscriptionAlert from './components/subscription-alert';
import { TopLists } from './components/top-lists';

dayjs.extend(relativeTime);

export type HomePageProps = {
  agentSubscription: any | null;
  stats: any;
  chartData: any[];
  topDestinations: any[];
  topAgents: any[];
  recentNotifications: any[];
  unreadNotificationsCount: number;
};

export default function Home() {
  const [isNotifExpanded, setIsNotifExpanded] = useState(false);

  const {
    company,
    stats,
    chartData,
    topDestinations,
    topAgents,
    recentNotifications = [],
    unreadNotificationsCount = 0,
  } = usePageProps<HomePageProps>();

  const displayedNotifications = isNotifExpanded
    ? recentNotifications
    : recentNotifications.slice(0, 2);

  return (
    <CompanyDashboardLayout
      activeMenuIds={[`home`]}
      breadcrumb={[{ title: 'Dashboard', url: '/dashboard' }]}
    >
      <Head title="Performance Dashboard" />
      <div className="grid grid-cols-1 gap-6 p-6 bg-slate-50/50 min-h-screen">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex flex-col gap-6 w-full">
            {company.type === 'agent' && <SubscriptionAlert />}
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome back, {company.name}!
              </h1>
              <p className="text-muted-foreground">
                Monitor performance and accelerate your growth today.
              </p>
            </div>
          </div>

          <Card className="w-full lg:w-[350px] shrink-0 border-none shadow-sm bg-white">
            <CardHeader className="py-2 px-3 flex flex-row items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="relative flex items-center justify-center">
                  <Bell className="h-4 w-4 text-slate-600" />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-slate-800">
                  Notification
                </CardTitle>
              </div>
              {unreadNotificationsCount > 0 && (
                <span className="text-[9px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unreadNotificationsCount} Unread
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0 flex flex-col">
              {recentNotifications.length > 0 ? (
                <>
                  <div className="divide-y divide-slate-50">
                    {displayedNotifications.map((notif: any) => (
                      <div
                        key={notif.id}
                        className="p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors"
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
                              'New Notification'}
                          </span>
                          <span className="text-[9px] text-slate-400 mt-0.5">
                            {dayjs(notif.created_at).fromNow()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-3 py-2 border-t border-slate-50 flex items-center justify-between bg-slate-50/50">
                    {recentNotifications.length > 2 ? (
                      <button
                        onClick={() => setIsNotifExpanded(!isNotifExpanded)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        {isNotifExpanded
                          ? 'Show Less'
                          : `View ${recentNotifications.length - 2} More`}
                      </button>
                    ) : (
                      <div />
                    )}
                    <Link
                      href={`/companies/${company.username}/dashboard/notifications`}
                      className="text-[10px] font-semibold text-primary hover:underline"
                    >
                      See All
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  You have no new notifications.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <SectionCards stats={stats} company={company} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChartAreaInteractive data={chartData} />
          </div>
          <div className="lg:col-span-1">
            <TopLists
              destinations={topDestinations}
              agents={topAgents}
              type={company.type}
            />
          </div>
        </div>
      </div>
    </CompanyDashboardLayout>
  );
}
