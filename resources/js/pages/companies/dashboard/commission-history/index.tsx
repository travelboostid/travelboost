import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
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
import { HandCoins, Receipt, Store, UserRound } from 'lucide-react';
import { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type CommissionHistoryItem = {
    id: number;
    booking_code: string;
    agent_name: string;
    vendor_name: string;
    customer_name: string;
    commission_amount: number;
    paid_at: string | null;
    created_at: string | null;
};

type CommissionHistoryProps = {
    commissions: CommissionHistoryItem[];
    summary: {
        total_records: number;
        total_amount: number;
    };
    companyType: 'agent' | 'vendor';
};

export default function AgentCommissionHistoryPage({
    commissions,
    summary,
    companyType,
}: CommissionHistoryProps) {
    const intl = useIntl();
    const isVendor = companyType === 'vendor';

    const summaryCards = useMemo(
        () => [
            {
                title: (
                    <FormattedMessage defaultMessage="Commission Transactions" />
                ),
                value: summary.total_records.toLocaleString('id-ID'),
                description: isVendor ? (
                    <FormattedMessage defaultMessage="Agent commission payouts from your wallet." />
                ) : (
                    <FormattedMessage defaultMessage="Agent commission received in your wallet." />
                ),
                icon: Receipt,
            },
            {
                title: isVendor ? (
                    <FormattedMessage defaultMessage="Commission Paid" />
                ) : (
                    <FormattedMessage defaultMessage="Commission Earned" />
                ),
                value: formatIDR(summary.total_amount || 0),
                description: isVendor ? (
                    <FormattedMessage defaultMessage="Total commission paid to agents." />
                ) : (
                    <FormattedMessage defaultMessage="Total commission received from vendors." />
                ),
                icon: HandCoins,
            },
        ],
        [isVendor, summary.total_amount, summary.total_records],
    );

    return (
        <CompanyDashboardLayout
            activeMenuIds={['funds.commission-history']}
            openMenuIds={['funds']}
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Funds',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Commission History',
                    }),
                },
            ]}
            containerClassName="min-h-screen bg-slate-50/60 dark:bg-slate-950"
        >
            <Head
                title={intl.formatMessage({
                    defaultMessage: 'Commission History',
                })}
            />

            <div className="mx-auto max-w-6xl space-y-6 p-4">
                <section className="grid gap-4 sm:grid-cols-2">
                    {summaryCards.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <Card
                                key={index}
                                className="border-slate-200 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                            >
                                <CardContent className="p-5 sm:p-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase dark:text-slate-500">
                                                {item.title}
                                            </p>
                                            <p className="mt-3 break-words text-2xl leading-tight font-bold text-slate-900 dark:text-slate-100">
                                                {item.value}
                                            </p>
                                        </div>
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
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
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/40">
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            <HandCoins className="h-5 w-5 text-primary" />
                            <FormattedMessage defaultMessage="Commission List" />
                        </CardTitle>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/30 dark:bg-slate-950/20">
                                <TableRow className="dark:border-slate-800">
                                    <TableHead className="min-w-40 px-5">
                                        <FormattedMessage defaultMessage="Booking Code" />
                                    </TableHead>
                                    <TableHead className="min-w-48">
                                        {isVendor ? (
                                            <FormattedMessage defaultMessage="Agent" />
                                        ) : (
                                            <FormattedMessage defaultMessage="Vendor" />
                                        )}
                                    </TableHead>
                                    <TableHead className="min-w-48">
                                        <FormattedMessage defaultMessage="Customer" />
                                    </TableHead>
                                    <TableHead className="min-w-44 text-right">
                                        <FormattedMessage defaultMessage="Commission" />
                                    </TableHead>
                                    <TableHead className="min-w-40 pr-5 text-right">
                                        <FormattedMessage defaultMessage="Date" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commissions.length === 0 ? (
                                    <TableRow className="dark:border-slate-800">
                                        <TableCell
                                            colSpan={5}
                                            className="h-36 px-5 text-center text-slate-500 dark:text-slate-400"
                                        >
                                            <FormattedMessage defaultMessage="No commission history found." />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    commissions.map((commission) => {
                                        const date =
                                            commission.paid_at ||
                                            commission.created_at;

                                        return (
                                            <TableRow
                                                key={commission.id}
                                                className="transition-colors hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                            >
                                                <TableCell className="px-5">
                                                    <Badge
                                                        variant="outline"
                                                        className="border-slate-200 bg-white font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                                    >
                                                        {
                                                            commission.booking_code
                                                        }
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                                                        <Store className="h-4 w-4 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-1">
                                                            {isVendor
                                                                ? commission.agent_name
                                                                : commission.vendor_name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                                                        <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                                                        <span className="line-clamp-1">
                                                            {
                                                                commission.customer_name
                                                            }
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-300">
                                                    {isVendor ? '-' : '+'}
                                                    {formatIDR(
                                                        Number(
                                                            commission.commission_amount ||
                                                                0,
                                                        ),
                                                    )}
                                                </TableCell>
                                                <TableCell className="pr-5 text-right text-sm text-slate-600 dark:text-slate-400">
                                                    {date
                                                        ? dayjs(date).format(
                                                              'DD MMM YYYY',
                                                          )
                                                        : '-'}
                                                    {date && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            {dayjs(date).format(
                                                                'HH:mm',
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </CompanyDashboardLayout>
    );
}
