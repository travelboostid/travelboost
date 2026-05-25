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
    console.log('withdrawal', withdrawal);
    return (
        <Item
            variant="outline"
            className="hover:bg-accent/50 transition-colors"
        >
            <div className="flex items-center gap-3 flex-1 p-4">
                <Landmark className="w-4 h-4" />
                <ItemContent>
                    <div className="flex items-center gap-3">
                        <ItemTitle className="font-semibold text-destructive">
                            {formatIDR(withdrawal.amount)}
                        </ItemTitle>
                        <span className="text-xs text-muted-foreground">
                            {dayjs(withdrawal.created_at).fromNow()}
                        </span>
                    </div>
                    <ItemDescription className="flex items-center gap-2">
                        <span>
                            {withdrawal.wallet?.name || 'Unknown Wallet'} →{' '}
                            {withdrawal.bank_account?.account_number} (
                            {withdrawal.bank_account?.provider})
                        </span>
                    </ItemDescription>
                </ItemContent>
            </div>
            <ItemActions className="pr-4">
                <Badge variant="secondary">{withdrawal.status}</Badge>
            </ItemActions>
        </Item>
    );
}
