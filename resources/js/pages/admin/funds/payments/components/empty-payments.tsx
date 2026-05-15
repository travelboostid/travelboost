import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyPayments() {
  return (
    <Empty className="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Payments Available</EmptyTitle>
        <EmptyDescription>
          There are no payments to display. Please check back later or change
          your filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
