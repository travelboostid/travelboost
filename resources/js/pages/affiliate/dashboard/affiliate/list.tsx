import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown, Percent, UserCheck, UserPlus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function AffiliateList({ affiliates, filters }: any) {
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState(filters.period || 'monthly');
  const [topCount, setTopCount] = useState(filters.top || '5');

  // Mengambil data grafik
  useEffect(() => {
    fetch(
      `/affiliate/dashboard/affiliate/chart-data?period=${period}&top=${topCount}`,
    )
      .then((res) => res.json())
      .then((data) => setChartData(data));
  }, [period, topCount]);

  // Fungsi saat filter Periode diubah (Update Tabel & Grafik)
  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    router.get(
      window.location.pathname,
      { ...filters, period: value },
      { preserveState: true, preserveScroll: true },
    );
  };

  const onSort = (field: string) => {
    const order =
      filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    router.get(
      window.location.pathname,
      { ...filters, sort: field, order },
      { preserveState: true, preserveScroll: true },
    );
  };

  const totalInvited = affiliates.data.reduce(
    (sum: number, item: any) => sum + (item.invited_count || 0),
    0,
  );
  const totalSubscribed = affiliates.data.reduce(
    (sum: number, item: any) => sum + (item.subscribed_count || 0),
    0,
  );
  const avgConversion =
    totalInvited > 0
      ? ((totalSubscribed / totalInvited) * 100).toFixed(1)
      : '0.0';

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Affiliate', url: '#' },
        { title: 'List', url: '#' },
      ]}
    >
      <Head title="Affiliate List" />

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Affiliate Network
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor the performance and conversion rates of your affiliates.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Affiliates
              </CardTitle>
              <Users className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {affiliates.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active in your network
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Invited Agents
              </CardTitle>
              <UserPlus className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {totalInvited}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across this page
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Subscriptions
              </CardTitle>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {totalSubscribed}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Converted agents
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Avg. Conversion
              </CardTitle>
              <Percent className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {avgConversion}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall success rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-xl">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6">
            <div>
              <CardTitle className="text-lg">
                Top Performance Comparison
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Invited agents vs Successful subscriptions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32 h-9 bg-slate-50">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="all_time">All Time</SelectItem>
                </SelectContent>
              </Select>
              <Select value={topCount} onValueChange={setTopCount}>
                <SelectTrigger className="w-28 h-9 bg-slate-50">
                  <SelectValue placeholder="Top N" />
                </SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15, 20, 25].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      Top {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px' }}
                />
                <Bar
                  dataKey="invited"
                  fill="#94a3b8"
                  name="Invited Agents"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="subscribed"
                  fill="#10b981"
                  name="Subscriptions"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHead
                  onClick={() => onSort('name')}
                  className="cursor-pointer hover:text-slate-900 transition-colors py-4"
                >
                  Affiliate Details{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead
                  onClick={() => onSort('invited_count')}
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Invited{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead
                  onClick={() => onSort('subscribed_count')}
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Subscribed{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead className="w-48">Conversion</TableHead>
                <TableHead
                  onClick={() => onSort('created_at')}
                  className="cursor-pointer hover:text-slate-900 transition-colors text-right pr-6"
                >
                  Joined Date{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No affiliates found.
                  </TableCell>
                </TableRow>
              ) : (
                affiliates.data.map((item: any) => {
                  const ratio = Math.min(
                    (item.subscribed_count / (item.invited_count || 1)) * 100,
                    100,
                  );
                  const badgeColor =
                    ratio >= 50
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                      : ratio >= 20
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-100';

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-semibold text-slate-900">
                          {item.user.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          @{item.user.username}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {item.invited_count}
                      </TableCell>
                      <TableCell className="font-medium text-emerald-600">
                        {item.subscribed_count}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${ratio}%` }}
                            ></div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] font-bold px-1.5 py-0.5 ${badgeColor}`}
                          >
                            {Math.round(ratio)}%
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-slate-600 pr-6 text-sm">
                        {new Date(item.user.created_at).toLocaleDateString(
                          'en-GB',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          },
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-900">
                {affiliates.from || 0}
              </span>{' '}
              to{' '}
              <span className="font-medium text-slate-900">
                {affiliates.to || 0}
              </span>{' '}
              of{' '}
              <span className="font-medium text-slate-900">
                {affiliates.total}
              </span>{' '}
              entries
            </div>
            <div className="flex gap-1.5">
              {affiliates.links.map((link: any, i: number) => (
                <Button
                  key={i}
                  variant={link.active ? 'default' : 'outline'}
                  size="sm"
                  asChild
                  disabled={!link.url}
                  className={
                    link.active
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-white'
                  }
                >
                  <Link
                    href={link.url || '#'}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </AffiliateDashboardLayout>
  );
}
