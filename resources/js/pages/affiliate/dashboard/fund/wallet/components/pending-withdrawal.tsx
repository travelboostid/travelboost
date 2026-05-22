import {
    Item,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import usePageProps from '@/hooks/use-page-props';
import { ShieldAlertIcon } from 'lucide-react';
import type { WalletPageProps } from '../index';

export default function PendingWithdrawal() {
    const { pending_withdrawal } = usePageProps<WalletPageProps>();

    return pending_withdrawal ? (
        <Item variant="outline" className="border-amber-200 bg-amber-50/30">
            <ItemMedia variant="icon" className="bg-amber-100 text-amber-600">
                <ShieldAlertIcon className="w-5 h-5" />
            </ItemMedia>
            <ItemContent>
                <ItemTitle className="text-amber-900">
                    You have a pending withdrawal
                </ItemTitle>
                <ItemDescription className="text-amber-700">
                    Please wait patiently while our finance team processes your
                    withdrawal request.
                </ItemDescription>
            </ItemContent>
        </Item>
    ) : null;
}
