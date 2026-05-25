import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyWithdrawals() {
    return (
        <Empty className="">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No Withdrawals Available</EmptyTitle>
                <EmptyDescription>
                    There are no withdrawals to display. Please check back later
                    or change your filters.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
