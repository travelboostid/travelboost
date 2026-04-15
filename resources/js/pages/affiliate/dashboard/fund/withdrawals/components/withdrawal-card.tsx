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
      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
      : withdrawal.status === 'rejected' || withdrawal.status === 'failed'
        ? 'bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200'
        : 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200';

  return (
    <Item
      variant="outline"
      className="hover:bg-slate-50 transition-colors border-slate-200 shadow-sm rounded-xl py-2"
    >
      <div className="flex items-center gap-4 flex-1 p-3">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
          <Landmark className="w-5 h-5" />
        </div>
        <ItemContent>
          <div className="flex items-center gap-3">
            <ItemTitle className="font-bold text-slate-900 text-base">
              {formatIDR(withdrawal.amount)}
            </ItemTitle>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {dayjs(withdrawal.created_at).format('DD MMM YYYY')}
            </span>
          </div>
          <ItemDescription className="flex items-center gap-2 mt-1">
            <span className="font-medium text-slate-700">
              {withdrawal.bankAccount?.bank_name || 'Bank'} • ****
              {withdrawal.bankAccount?.account_number?.slice(-4) || '0000'}
            </span>
            {withdrawal.note && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 italic">
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
