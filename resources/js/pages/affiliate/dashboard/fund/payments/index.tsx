import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
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
import { Head } from '@inertiajs/react';
import dayjs from 'dayjs';
import { BadgePercent, HandCoins, Receipt, Wallet } from 'lucide-react';

type CommissionHistoryProps = {
    commissions: any[];
    summary: {
        total_records: number;
        total_amount: number;
    };
};

export default function AffiliatePaymentHistory({
    commissions,
    summary,
}: CommissionHistoryProps) {
    const summaryCards = [
        {
            title: 'Total Records',
            value: summary.total_records.toLocaleString('id-ID'),
            description: 'Commission entries in this period.',
            icon: Receipt,
        },
        {
            title: 'Total Commission',
            value: formatIDR(summary.total_amount || 0),
            description: 'Commission received in this period.',
            icon: Wallet,
        },
    ];

    return (
        <AffiliateDashboardLayout
            activeMenuIds={['fund.payments']}
            openMenuIds={['fund']}
            breadcrumb={[
                { title: 'Fund', url: '#' },
                {
                    title: 'Commission History',
                    url: '/affiliate/dashboard/fund/commission-history',
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head title="Commission History" />

            <div className="mx-auto max-w-6xl space-y-6">
                {/* <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Commission History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review commissions received from agent subscriptions across your
            affiliate network.
          </p>
        </div> */}

                <section className="grid gap-4 sm:grid-cols-2">
                    {summaryCards.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={item.title}
                                className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                                                {item.title}
                                            </p>
                                            <p className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">
                                                {item.value}
                                            </p>
                                        </div>
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
                                            <Icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                                        {item.description}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                            <HandCoins className="h-5 w-5 text-primary" />
                            Commission List
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/30 dark:bg-slate-950/20">
                                <TableRow className="dark:border-slate-800">
                                    <TableHead className="px-6">
                                        Source Agent
                                    </TableHead>
                                    <TableHead>Tier</TableHead>
                                    {/* <TableHead className="text-right">Base Amount</TableHead> */}
                                    <TableHead className="text-right">
                                        Rate
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Commission
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="pr-6 text-right">
                                        Date
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissions.length === 0 ? (
                                    <TableRow className="dark:border-slate-800">
                                        <TableCell
                                            colSpan={7}
                                            className="h-32 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            No commission history found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    commissions.map((commission) => (
                                        <TableRow
                                            key={commission.id}
                                            className="transition-colors hover:bg-slate-50/50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                        >
                                            <TableCell className="px-6">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                                    {commission.company_name}
                                                </div>
                                                {/* <div className="text-xs text-slate-500 dark:text-slate-400">
                          {commission.payment_method ||
                            commission.provider ||
                            '-'}
                        </div> */}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                >
                                                    {String(
                                                        commission.tier,
                                                    ).replace(/_/g, ' ')}
                                                </Badge>
                                            </TableCell>
                                            {/* <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {formatIDR(Number(commission.base_amount || 0))}
                      </TableCell> */}
                                            <TableCell className="text-right">
                                                <div className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                    <BadgePercent className="h-4 w-4 text-primary" />
                                                    {Number(
                                                        commission.commission_rate,
                                                    )}
                                                    %
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-300">
                                                +
                                                {formatIDR(
                                                    Number(
                                                        commission.commission_amount ||
                                                            0,
                                                    ),
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`capitalize ${
                                                        commission.status ===
                                                        'paid'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
                                                            : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300'
                                                    }`}
                                                >
                                                    {commission.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="pr-6 text-right text-sm text-slate-600 dark:text-slate-400">
                                                {dayjs(
                                                    commission.created_at,
                                                ).format('DD MMM YYYY')}
                                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                    {dayjs(
                                                        commission.created_at,
                                                    ).format('HH:mm')}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AffiliateDashboardLayout>
    );
}
