import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';

export function EmptyRegistrations() {
    return (
        <Empty className="">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No Data Available" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="There are no vendor registrations to display." />
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
