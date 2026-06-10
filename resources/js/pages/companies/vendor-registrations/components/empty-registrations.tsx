import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { Building2Icon } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

export function EmptyRegistrations() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <Building2Icon />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No vendor registrations" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="No registrations match your filters. Try adjusting the search or status filters." />
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
