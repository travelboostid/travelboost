import { Card, CardContent } from '@/components/ui/card';
import { formatIDRFull } from '@/lib/utils';

export default function WithdrawalsSummary({ stats }: { stats: any }) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total Requests
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                        {stats.total_withdrawals}
                    </p>
                </CardContent>
            </Card>
            <Card className="border-slate-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-5">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Total Amount
                    </p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                        {formatIDRFull(stats.total_amount)}
                    </p>
                </CardContent>
            </Card>
            <Card className="border-emerald-100 bg-emerald-50 shadow-xs dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <CardContent className="p-5">
                    <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        Paid/Success
                    </p>
                    <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-300">
                        {formatIDRFull(stats.completed_amount)}
                    </p>
                </CardContent>
            </Card>
            <Card className="border-amber-100 bg-amber-50 shadow-xs dark:border-amber-500/20 dark:bg-amber-500/10">
                <CardContent className="p-5">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        Pending/Processing
                    </p>
                    <p className="mt-1 text-xl font-bold text-amber-600 dark:text-amber-300">
                        {formatIDRFull(stats.pending_amount)}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
