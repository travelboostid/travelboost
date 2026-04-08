import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export default function EmptyWithdrawals() {
  return (
    <Empty className="p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Withdrawals</EmptyTitle>
        <EmptyDescription>
          You have not made any withdrawals in the current period. Withdrawals
          will appear here once they are made.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
