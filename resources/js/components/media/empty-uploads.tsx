import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export function EmptyUploads() {
  return (
    <Empty className="">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Recent Uploads</EmptyTitle>
        <EmptyDescription>
          There are no uploads to display. Please upload some media to see them
          here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
