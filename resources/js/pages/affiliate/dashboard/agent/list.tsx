import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpDown } from 'lucide-react';

export default function AgentList({ agents, isMaster, filters }: any) {
  // Fungsi Sorting ketika table head di-klik
  const onSort = (field: string) => {
    const order =
      filters.sort === field && filters.order === 'asc' ? 'desc' : 'asc';
    router.get(
      window.location.pathname,
      { ...filters, sort: field, order },
      { preserveState: true, preserveScroll: true },
    );
  };

  // Format Rupiah untuk Potensi Komisi
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AffiliateDashboardLayout
      breadcrumb={[
        { title: 'Agent', url: '#' },
        { title: 'List', url: '#' },
      ]}
    >
      <Head title="Agent List" />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Referrals</h1>
          <p className="text-muted-foreground mt-1">
            {isMaster
              ? 'List of all agents registered directly under you and your affiliate network.'
              : 'List of agents who registered using your referral code.'}
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow>
                <TableHead
                  onClick={() => onSort('name')}
                  className="cursor-pointer hover:text-slate-900 transition-colors py-4"
                >
                  Agent Info{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>

                {/* Kolom ini HANYA MUNCUL JIKA MA (Master Affiliate) */}
                {isMaster && (
                  <TableHead
                    onClick={() => onSort('affiliator_name')}
                    className="cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    Invited By{' '}
                    <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                  </TableHead>
                )}

                <TableHead
                  onClick={() => onSort('status')}
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Status{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead
                  onClick={() => onSort('package')}
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Sub. Package{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead
                  onClick={() => onSort('subscription_date')}
                  className="cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Sub. Date{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
                <TableHead
                  onClick={() => onSort('potential_commission')}
                  className="cursor-pointer hover:text-slate-900 transition-colors text-right pr-6"
                >
                  Est. Commission{' '}
                  <ArrowUpDown className="inline w-3 h-3 ml-1 text-slate-400" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isMaster ? 6 : 5}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No agents found in your network.
                  </TableCell>
                </TableRow>
              ) : (
                agents.data.map((item: any) => {
                  let badgeColor =
                    'bg-slate-100 text-slate-700 hover:bg-slate-100';
                  if (item.status === 'Pending Subscription')
                    badgeColor =
                      'bg-amber-100 text-amber-700 hover:bg-amber-100';
                  if (item.status === 'Subscribed')
                    badgeColor =
                      'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-semibold text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.email}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Joined:{' '}
                          {new Date(item.created_at).toLocaleDateString(
                            'en-GB',
                          )}
                        </div>
                      </TableCell>

                      {/* Tampilkan nama affiliator khusus untuk MA */}
                      {isMaster && (
                        <TableCell>
                          <span
                            className={`text-sm font-medium ${item.affiliator_name === 'Direct (Me)' ? 'text-blue-600' : 'text-slate-700'}`}
                          >
                            {item.affiliator_name}
                          </span>
                        </TableCell>
                      )}

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs font-semibold px-2 py-0.5 ${badgeColor}`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700 text-sm">
                        {item.package}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">
                        {item.subscription_date !== '-'
                          ? new Date(item.subscription_date).toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span
                          className={`font-semibold ${item.potential_commission > 0 ? 'text-emerald-600' : 'text-slate-400'}`}
                        >
                          {formatCurrency(item.potential_commission)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* PAGINATION */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              Showing{' '}
              <span className="font-medium text-slate-900">
                {agents.from || 0}
              </span>{' '}
              to{' '}
              <span className="font-medium text-slate-900">
                {agents.to || 0}
              </span>{' '}
              of{' '}
              <span className="font-medium text-slate-900">{agents.total}</span>{' '}
              agents
            </div>
            <div className="flex gap-1.5">
              {agents.links.map((link: any, i: number) => (
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
