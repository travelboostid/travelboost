import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconTicket } from '@tabler/icons-react';

export function EmptyBookings() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconTicket />
        </EmptyMedia>
        <EmptyTitle>No Bookings Found</EmptyTitle>
        <EmptyDescription>
          There are no bookings to display. Please check back later or adjust
          your filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
