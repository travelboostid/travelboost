import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyRegistrations() {
  return (
    <Empty className="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Data Available</EmptyTitle>
        <EmptyDescription>
          There are no vendor registrations to display.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
