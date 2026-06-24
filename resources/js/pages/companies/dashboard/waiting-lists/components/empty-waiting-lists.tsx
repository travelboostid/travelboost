import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { ListIcon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function EmptyWaitingLists() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ListIcon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No Waiting Lists Yet" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="No waiting-list requests match the current filters. Try a different search or check back after new requests are submitted." />
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
