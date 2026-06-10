import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { WalletIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import { TopupDialog } from './topup-dialog';

export default function EmptyRecentTransactions() {
    return (
        <Empty className="rounded-xl border border-dashed bg-muted/20 p-6 sm:p-8">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <WalletIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No transactions yet" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="Top up your wallet to get started. Your income and expenses will show up here." />
                </EmptyDescription>
            </EmptyHeader>
            <TopupDialog>
                <Button className="mt-2">
                    <FormattedMessage defaultMessage="Top up wallet" />
                </Button>
            </TopupDialog>
        </Empty>
    );
}
