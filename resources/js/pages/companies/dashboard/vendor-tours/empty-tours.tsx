import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';
import { FormattedMessage } from 'react-intl';

export function EmptyTours() {
    return (
        <Empty className="min-h-[75vh]">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>
                    <FormattedMessage defaultMessage="No Tours Yet" />
                </EmptyTitle>
                <EmptyDescription>
                    <FormattedMessage defaultMessage="This vendor hasn't created any tours yet. Please check back later or contact the vendor." />
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
