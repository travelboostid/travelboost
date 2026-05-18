import { Badge } from '@/components/ui/badge';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item';
import { formatIDR } from '@/lib/utils';
import dayjs from 'dayjs';
import { Landmark } from 'lucide-react';

export default function WithdrawalCard({ withdrawal }: { withdrawal: any }) {
  const badgeColor =
    withdrawal.status === 'paid'
      ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-300'
      : withdrawal.status === 'rejected' || withdrawal.status === 'failed'
        ? 'border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:border-rose-500/20 dark:bg-rose-500/15 dark:text-rose-300'
        : 'border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-300';

  return (
    <Item
      variant="outline"
      className="rounded-xl border-slate-200 py-2 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/50"
    >
      <div className="flex flex-1 items-center gap-4 p-3">
        <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          <Landmark className="h-5 w-5" />
        </div>
        <ItemContent>
          <div className="flex flex-wrap items-center gap-3">
            <ItemTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
              {formatIDR(withdrawal.amount)}
            </ItemTitle>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {dayjs(withdrawal.created_at).format('DD MMM YYYY')}
            </span>
          </div>
          <ItemDescription className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {withdrawal.bankAccount?.bank_name || 'Bank'} • ****
              {withdrawal.bankAccount?.account_number?.slice(-4) || '0000'}
            </span>
            {withdrawal.note && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-xs italic text-slate-500 dark:text-slate-400">
                  {withdrawal.note}
                </span>
              </>
            )}
          </ItemDescription>
        </ItemContent>
      </div>
      <ItemActions className="pr-5">
        <Badge
          variant="outline"
          className={`capitalize px-3 py-1 ${badgeColor}`}
        >
          {withdrawal.status}
        </Badge>
      </ItemActions>
    </Item>
  );
}
