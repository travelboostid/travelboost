import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { ReceiptTextIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type EmptyWalletTransactionsProps = {
    showClearFilters?: boolean;
    onClearFilters?: () => void;
};

export default function EmptyWalletTransactions({
    showClearFilters = false,
    onClearFilters,
}: EmptyWalletTransactionsProps) {
    return (
        <Empty className="rounded-xl border border-dashed bg-muted/20 p-6 sm:p-8">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ReceiptTextIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No transactions found" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="Try adjusting the date range or transaction type filter to see more activity." />
                </EmptyDescription>
            </EmptyHeader>
            {showClearFilters && onClearFilters ? (
                <Button
                    type="button"
                    variant="outline"
                    className="mt-2"
                    onClick={onClearFilters}
                >
                    <FormattedMessage defaultMessage="Reset filters" />
                </Button>
            ) : null}
        </Empty>
    );
}
