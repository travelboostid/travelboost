import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  Clock,
  Download,
  Gift,
  LockKeyhole,
  Megaphone,
  UserPlus,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

// --- DUMMY DATA ---
const chartData = [
  { day: '1', revenue: 1000000, commission: 100000 },
  { day: '5', revenue: 1500000, commission: 150000 },
  { day: '10', revenue: 1200000, commission: 120000 },
  { day: '15', revenue: 2800000, commission: 280000 },
  { day: '20', revenue: 2100000, commission: 210000 },
  { day: '25', revenue: 3500000, commission: 350000 },
  { day: '30', revenue: 3200000, commission: 320000 },
];

const recentAgents = [
  {
    id: 'AG-101',
    name: 'Budi Travel',
    package: 'Enterprise',
    date: 'Mar 28, 2026',
    status: 'Paid',
  },
  {
    id: 'AG-102',
    name: 'Sinar Tour',
    package: 'Pro',
    date: 'Mar 27, 2026',
    status: 'Pending',
  },
  {
    id: 'AG-103',
    name: 'Nusa Holiday',
    package: 'Basic',
    date: 'Mar 25, 2026',
    status: 'Paid',
  },
  {
    id: 'AG-104',
    name: 'Jaya Wisata',
    package: 'Enterprise',
    date: 'Mar 24, 2026',
    status: 'Failed',
  },
];

const networkPerformance = [
  {
    name: 'Diana Fitri (MA)',
    level: 'Tier 1',
    agents: 14,
    revenue: 5000000,
    status: 'Active',
  },
  {
    name: 'Agus Pramono',
    level: 'Tier 2',
    agents: 8,
    revenue: 2500000,
    status: 'Active',
  },
  {
    name: 'Rina Wijaya',
    level: 'Tier 1',
    agents: 5,
    revenue: 1500000,
    status: 'Active',
  },
  {
    name: 'Toko Tiket',
    level: 'Tier 3',
    agents: 2,
    revenue: 500000,
    status: 'Warning',
  },
];

export default function AffiliateDashboardIndex({ auth }: any) {
  const user = auth?.user || { name: 'Affiliate Partner' };
  const profile = user?.affiliate_profile || user?.affiliateProfile;

  // STATUS & PROFILE COMPLETION LOGIC
  const isPendingApproval = profile?.status === 'pending';
  const isProfileIncomplete = !user?.phone || !profile?.address;

  return (
    <AffiliateDashboardLayout
      activeMenuIds={['dashboard']}
      breadcrumb={[{ title: 'Dashboard', url: '/affiliate/dashboard' }]}
    >
      <Head title="Dashboard" />

      <div className="max-w-7xl mx-auto space-y-6 relative">
        {/* =========================================
            BLUR OVERLAY IF ACCOUNT IS PENDING
            ========================================= */}
        {isPendingApproval && (
          <div className="absolute inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <Card className="w-full max-w-lg shadow-2xl border-amber-200 bg-white/95 backdrop-blur-md p-8 text-center rounded-2xl mx-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                <LockKeyhole className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                Account Pending Approval
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Your registration as an affiliate partner is currently in the
                review queue by your Network Partner. Dashboard access is
                temporarily locked until approved.
              </p>

              {isProfileIncomplete ? (
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-left">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Speed Up Verification!
                      </h4>
                      <p className="text-sm text-blue-700 mt-1 mb-4">
                        We detected that your profile is incomplete. Please fill
                        out your contact details and address to expedite the
                        process.
                      </p>
                      <Button
                        asChild
                        className="w-full bg-blue-600 hover:bg-blue-700 shadow-sm"
                      >
                        <Link href="/affiliate/dashboard/setup/profile">
                          Complete Profile Now
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-600 text-sm font-medium">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Your profile is complete. Please wait for approval.
                </div>
              )}
            </Card>
          </div>
        )}
        {/* ========================================= */}

        {/* BLUE BANNER (Only Shows If Approved BUT Profile Incomplete) */}
        {!isPendingApproval && isProfileIncomplete && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 border border-blue-200 p-4 rounded-xl shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900">
                  Incomplete Profile
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Please complete your personal details such as WhatsApp Number
                  and Address so your commissions can be processed without
                  issues.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              asChild
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Link href="/affiliate/dashboard/setup/profile">
                Complete Profile
              </Link>
            </Button>
          </div>
        )}

        {/* =========================================
            MAIN DASHBOARD CONTENT
            (Di blur pas belom di approve MA / Partner)
            ========================================= */}
        <div
          className={`space-y-6 transition-all duration-300 ${isPendingApproval ? 'blur-[4px] opacity-40 pointer-events-none select-none grayscale-[30%]' : ''}`}
        >
          {/* HEADER & BALANCE */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">
                Affiliate Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user.name}!
              </p>
            </div>
            <div className="flex items-center gap-4 bg-emerald-50 px-5 py-3 rounded-xl border border-emerald-100">
              <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800">
                  Available Balance
                </p>
                <p className="text-xl font-bold text-emerald-700">
                  {formatIDR(12500000)}
                </p>
              </div>
            </div>
          </div>

          {/* 4 STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-500">
                    Invited Agents (This Month)
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                  >
                    +12%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  28{' '}
                  <span className="text-sm font-normal text-slate-500">
                    Agents
                  </span>
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-500">
                    Total Sub. Transactions
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                  >
                    +8%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatIDR(145000000)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-500">
                    Est. Incoming Commission
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                  >
                    +15%
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatIDR(11600000)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm border-slate-200 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-medium text-slate-500">
                    Active Affiliate Network
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                  >
                    +2
                  </Badge>
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  14{' '}
                  <span className="text-sm font-normal text-slate-500">
                    Partners
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* MIDDLE SECTION */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* CHART */}
            <Card className="lg:col-span-2 shadow-sm border-slate-200">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700">
                    Registration & Commission Trends
                  </CardTitle>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1 text-slate-500">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>{' '}
                      Total Revenue
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{' '}
                      Net Commission
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[250px] mt-4 w-full px-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: 20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorCommission"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#94a3b8"
                      fill="#f8fafc"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="commission"
                      stroke="#10b981"
                      fill="url(#colorCommission)"
                      strokeWidth={3}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* QUICK ACTIONS */}
            <Card className="lg:col-span-1 shadow-sm border-slate-200 bg-slate-50/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  disabled={isPendingApproval}
                  className="w-full justify-start h-12 bg-emerald-600 hover:bg-emerald-700 shadow-sm text-sm"
                >
                  <UserPlus className="w-4 h-4 mr-3" /> Invite New Agent
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 shadow-sm text-sm"
                >
                  <Gift className="w-4 h-4 mr-3" /> Check Promo Slots
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 border-slate-200 text-slate-700 bg-white shadow-sm text-sm"
                >
                  <Download className="w-4 h-4 mr-3" /> Download Marketing Kit
                </Button>
              </CardContent>
            </Card>

            {/* WIDGETS */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <Card className="shadow-sm border-slate-200 flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700 flex items-center justify-between">
                    This Week's Agenda{' '}
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100 text-xs">
                    <p className="font-semibold text-blue-800">
                      Marketing Strategy Webinar
                    </p>
                    <p className="text-blue-600 mt-0.5">Thursday, 14:00 WIB</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                    <p className="font-semibold text-emerald-800">
                      Commission Withdrawal Deadline
                    </p>
                    <p className="text-emerald-600 mt-0.5">Friday, 23:59 WIB</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700 flex items-center justify-between">
                    Announcements{' '}
                    <Megaphone className="w-4 h-4 text-slate-400" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-2 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-bold text-slate-800">
                        Price Update:
                      </span>{' '}
                      Enterprise package price dropped for April.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* BOTTOM TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700">
                  Recent Registrations
                </CardTitle>
                <a
                  href="#"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  View all
                </a>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">
                      Agent ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Agent Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Package
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium text-xs text-slate-900">
                        {agent.id}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {agent.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {agent.package}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${
                            agent.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : agent.status === 'Pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-slate-700">
                  Network Performance (Top 4)
                </CardTitle>
                <a
                  href="#"
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  View all
                </a>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold">
                      Affiliate Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Level
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Revenue
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {networkPerformance.map((net, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-slate-900">
                        {net.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {net.level}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-emerald-600">
                        {formatIDR(net.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${
                            net.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {net.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>
    </AffiliateDashboardLayout>
  );
}
