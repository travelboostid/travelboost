import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyOrders() {
    return (
        <Empty className="">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconFolderCode />
                </EmptyMedia>
                <EmptyTitle>No orders found</EmptyTitle>
                <EmptyDescription>
                    Tour bookings will appear here. Try adjusting your filters
                    if you expected results.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
