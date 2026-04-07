import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import dayjs from 'dayjs';
import { Download, Eye } from 'lucide-react';

interface Payment {
  id: string;
  date: string;
  period: string;
  amount: number;
  status: string;
  type: string;
}

interface PaymentHistoryProps {
  payments: Payment[];
}

export function PaymentHistory({ payments }: PaymentHistoryProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>
          View your subscription payments and invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-700">Date</TableHead>
                <TableHead className="text-slate-700">Period</TableHead>
                <TableHead className="text-right text-slate-700">
                  Amount
                </TableHead>
                <TableHead className="text-slate-700">Status</TableHead>
                <TableHead className="text-right text-slate-700">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment.id}
                  className="border-slate-200 hover:bg-slate-50"
                >
                  <TableCell className="font-medium text-slate-900">
                    {dayjs(payment.date).format('MMM D, YYYY')}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {payment.period}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    ${payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
                        title="View invoice"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-100"
                        title="Download invoice"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {payments.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-slate-600">
              No payment history available
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
