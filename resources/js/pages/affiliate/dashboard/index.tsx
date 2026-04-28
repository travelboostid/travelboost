// index.tsx
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
import { AlertCircle, Clock, LockKeyhole, Wallet } from 'lucide-react';

const recentAgents = [
  { id: 'AG-101', name: 'Budi Travel', package: 'Enterprise', status: 'Paid' },
  { id: 'AG-102', name: 'Sinar Tour', package: 'Pro', status: 'Pending' },
];

const networkPerformance = [
  { name: 'Diana Fitri (MA)', revenue: 5000000, status: 'Active' },
  { name: 'Agus Pramono', revenue: 2500000, status: 'Active' },
];

export default function AffiliateDashboardIndex({
  auth,
  wallet_balance = 0,
  tier = 'affiliate',
  stats = {},
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase">
                Affiliate Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user.name}!
              </p>
            </div>
            <div className="flex items-center gap-4 bg-primary/10 px-5 py-3 rounded-xl border border-primary/20">
              <div className="p-2 bg-primary/20 rounded-full text-primary">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">
                  Wallet Balance
                </p>
                <p className="text-xl font-bold text-primary">
                  {formatIDR(wallet_balance)}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`grid gap-4 ${!isPartner && !isMaster ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}
          >
            {isPartner && (
              <>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Master Affiliates
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_ma || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Affiliators
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_affiliate || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Agent Networks
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_agent || 0}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {isMaster && (
              <>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Agent Networks
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_agent || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total Affiliators
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_affiliate_approved || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-amber-200 bg-amber-50/30 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      Pending Approvals
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.total_affiliate_pending || 0}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {!isPartner && !isMaster && (
              <>
                <Card className="shadow-sm border-amber-200 bg-amber-50/30 hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-amber-700 mb-2">
                      Pending Agents (Unpaid)
                    </p>
                    <p className="text-2xl font-bold text-amber-600">
                      {stats.total_agent_pending || 0}
                    </p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-border hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Subscribed Agents
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.total_agent_subscribed || 0}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="shadow-sm border-primary/20 bg-primary/5 hover:shadow-md transition-all">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-primary mb-2">
                  Total Earned Commission
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatIDR(stats.total_commission || 0)}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm border-border overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-foreground">
                  Recent Registrations
                </CardTitle>
                <a
                  href="/affiliate/dashboard/agent/list"
                  className="text-xs font-semibold text-primary hover:text-primary/80"
                >
                  View all
                </a>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
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
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {agent.name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {agent.package}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0 ${agent.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
                        >
                          {agent.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <Card className="shadow-sm border-border overflow-hidden">
              <CardHeader className="bg-muted/50 border-b border-border flex flex-row items-center justify-between py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-tight text-foreground">
                  Network Performance
                </CardTitle>
                <a
                  href="/affiliate/dashboard/network/list"
                  className="text-xs font-semibold text-primary hover:text-primary/80"
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
                      <TableCell className="font-semibold text-xs text-foreground">
                        {net.name}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-primary">
                        {formatIDR(net.revenue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-2 py-0 bg-emerald-50 text-emerald-700 border-emerald-200"
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
