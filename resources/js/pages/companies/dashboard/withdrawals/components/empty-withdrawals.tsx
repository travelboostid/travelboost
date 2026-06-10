import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { ArrowDownRightIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

type EmptyWithdrawalsProps = {
    showClearFilters?: boolean;
    onClearFilters?: () => void;
};

export default function EmptyWithdrawals({
    showClearFilters,
    onClearFilters,
}: EmptyWithdrawalsProps) {
    return (
        <Empty className="rounded-xl border border-dashed py-10">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ArrowDownRightIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No withdrawals found" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="Withdrawals for the selected period will appear here." />
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
