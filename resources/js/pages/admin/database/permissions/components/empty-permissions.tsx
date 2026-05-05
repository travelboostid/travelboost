import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyPermissions() {
  return (
    <Empty className="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Permissions Available</EmptyTitle>
        <EmptyDescription>
          There are no permissions to display. Please check back later or change
          your filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
