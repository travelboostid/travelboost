import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyTours() {
  return (
    <Empty className="min-h-[75vh]">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Tours Yet</EmptyTitle>
        <EmptyDescription>
          This vendor haven&apos;t created any tours yet. Please do check later
          or try to contact the vendor.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
