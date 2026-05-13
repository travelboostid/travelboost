import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Card, CardContent } from '@/components/ui/card';
import usePageProps from '@/hooks/use-page-props';
import { formatIDR } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Bell, LayoutDashboard, Sparkles } from 'lucide-react';
import { ChartAreaInteractive } from './components/chart-area-interactive';
import { SectionCards } from './components/section-cards';
import SubscriptionAlert from './components/subscription-alert';

dayjs.extend(relativeTime);

export default function Home() {
  const {
    company,
    stats,
    chartData,
    topDestinations,
    topAgents,
    recentNotifications = [],
    unreadNotificationsCount = 0,
  } = usePageProps<any>();

  return (
    <CompanyDashboardLayout
      activeMenuIds={[`home`]}
      breadcrumb={[{ title: 'Dashboard' }]}
      containerClassName="bg-slate-50/30 dark:bg-slate-950 min-h-screen"
    >
      <Head title="Executive Overview" />
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-4000 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                <LayoutDashboard size={14} /> Global performance analytics for{' '}
                {company.name}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex flex-col items-end mr-4">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">
                  Wallet Balance
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                  {formatIDR(stats.wallet?.balance || 0)}
                </span>
              </div>
              <Link
                href={`/companies/${company.username}/dashboard/notifications`}
                className="relative p-2.5 bg-white dark:bg-slate-900 rounded-full ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm transition-all hover:ring-2 hover:ring-primary/20"
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

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <SectionCards stats={stats} company={company} />
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-2 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <ChartAreaInteractive data={chartData} />
              </div>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border-none bg-primary text-primary-foreground shadow-sm overflow-hidden relative">
                <div className="absolute -right-4 -bottom-4 opacity-20">
                  <Sparkles size={120} />
                </div>
                <CardContent className="p-6">
                  <span className="text-primary-foreground/80 text-[10px] font-black uppercase tracking-[0.2em]">
                    AI Capabilities
                  </span>
                  <h3 className="text-2xl font-bold mt-2">
                    {formatIDR(stats.ai_credit || 0)}
                  </h3>
                  <p className="text-xs text-primary-foreground/80 mt-1">
                    Available Credits
                  </p>
                  <Link
                    href={`/companies/${company.username}/dashboard/${company.type === 'agent' ? 'chatbot' : 'ai-credits'}`}
                  >
                    <button className="mt-6 w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold transition-all border border-white/20">
                      Recharge Now
                    </button>
                  </Link>
                </CardContent>
              </Card>

              {/* <TopLists
                destinations={topDestinations}
                agents={topAgents}
                type={company.type}
              /> */}

              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  Activity Feed
                  <Link
                    href={`/companies/${company.username}/dashboard/notifications`}
                    className="text-xs text-primary hover:underline"
                  >
                    View All
                  </Link>
                </h4>
                <div className="mt-6 space-y-5">
                  {recentNotifications.slice(0, 3).map((notif: any) => (
                    <div
                      key={notif.id}
                      className="flex gap-4 group cursor-default"
                    >
                      <div className="w-1 h-8 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors" />
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {notif.data?.title || notif.data?.message}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-tighter font-medium">
                          {dayjs(notif.created_at).fromNow()}
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
