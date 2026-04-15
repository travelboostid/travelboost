import AffiliateDashboardLayout from '@/components/layouts/affiliate-dashboard';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
import { CreditCard, Receipt } from 'lucide-react';

export default function AffiliatePaymentHistory({ payments }: any) {
  return (
    <AffiliateDashboardLayout
      activeMenuIds={['fund.payments']}
      openMenuIds={['fund']}
      breadcrumb={[
        { title: 'Fund', url: '#' },
        { title: 'Payment History', url: '/affiliate/dashboard/fund/payments' },
      ]}
    >
      <Head title="Payment History" />

      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Payment History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            List of all your successful and pending payments to the platform.
          </p>
        </div>

        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Transaction List
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead>Payment Info</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-32 text-center text-slate-500"
                  >
                    No payment history found.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment: any) => {
                  const isPaid = payment.status === 'paid';
                  return (
                    <TableRow
                      key={payment.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          #{payment.id}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">
                          {payment.payable_type
                            ?.replace(/([A-Z])/g, ' $1')
                            .trim() || 'Payment'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-700">
                            {payment.payment_method || payment.provider}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-slate-900">
                        {formatIDR(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 text-sm text-slate-600">
                        {dayjs(payment.created_at).format('DD MMM YYYY')}
                        <div className="text-[10px] text-slate-400">
                          {dayjs(payment.created_at).format('HH:mm')}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AffiliateDashboardLayout>
  );
}
