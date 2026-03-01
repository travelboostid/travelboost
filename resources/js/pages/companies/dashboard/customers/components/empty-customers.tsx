import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyCustomers() {
  return (
    <Empty className="min-h-[75vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Customers Yet</EmptyTitle>
        <EmptyDescription>
          You haven't acquired any customers yet. Please do check later.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
