import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { CoinsIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type EmptyPaymentsProps = {
    showClearFilters?: boolean;
    onClearFilters?: () => void;
};

export default function EmptyPayments({
    showClearFilters,
    onClearFilters,
}: EmptyPaymentsProps) {
    return (
        <Empty className="rounded-xl border border-dashed py-10">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <CoinsIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No payments found" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="Payments for the selected period will appear here." />
                </EmptyDescription>
            </EmptyHeader>
            {showClearFilters ? (
                <EmptyContent>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                    >
                        <FormattedMessage defaultMessage="Clear filters" />
                    </Button>
                </EmptyContent>
            ) : null}
        </Empty>
    );
}
