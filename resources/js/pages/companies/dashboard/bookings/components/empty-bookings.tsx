import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { IconTicket } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';

export function EmptyBookings() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconTicket />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No Bookings Found" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="There are no bookings to display. Please check back later or adjust your filters." />
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
