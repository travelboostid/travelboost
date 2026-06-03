import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import usePageProps from '@/hooks/use-page-props';
import { ShieldAlertIcon } from 'lucide-react';
import type { WalletPageProps } from '..';
import CancelPayment from '../../payments/components/cancel-payment';
import ContinuePayment from './continue-payment';

export default function PendingTopup() {
    const { pendingTopup } = usePageProps<WalletPageProps>();

    return pendingTopup ? (
        <Item variant="outline">
            <ItemMedia variant="icon">
                <ShieldAlertIcon />
            </ItemMedia>
            <ItemContent>
                <ItemTitle>You have unpaid topups</ItemTitle>
                <ItemDescription>
                    Please review and complete your pending wallet topups.
                </ItemDescription>
            </ItemContent>
            <ItemActions>
                <CancelPayment payment={pendingTopup} />
                <ContinuePayment payment={pendingTopup} />
            </ItemActions>
        </Item>
    ) : null;
}
