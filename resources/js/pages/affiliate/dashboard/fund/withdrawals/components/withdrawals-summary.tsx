import { Card, CardContent } from '@/components/ui/card';
import { formatIDR } from '@/lib/utils';

export default function WithdrawalsSummary({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-5">
          <p className="text-xs text-slate-500 font-medium">Total Requests</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {stats.total_withdrawals}
          </p>
        </CardContent>
      </Card>
      <Card className="shadow-xs border-slate-200">
        <CardContent className="p-5">
          <p className="text-xs text-slate-500 font-medium">Total Amount</p>
          <p className="text-xl font-bold text-slate-900 mt-1">
            {formatIDR(stats.total_amount)}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-emerald-50 shadow-xs border-emerald-100">
        <CardContent className="p-5">
          <p className="text-xs text-emerald-800 font-medium">Paid/Success</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatIDR(stats.completed_amount)}
          </p>
        </CardContent>
      </Card>
      <Card className="bg-amber-50 shadow-xs border-amber-100">
        <CardContent className="p-5">
          <p className="text-xs text-amber-800 font-medium">
            Pending/Processing
          </p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatIDR(stats.pending_amount)}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
