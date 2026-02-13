import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconFolderCode } from '@tabler/icons-react';

export default function EmptyWalletTransactions() {
  return (
    <Empty className="p-4">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Wallet Transactions</EmptyTitle>
        <EmptyDescription>
          You have not made any wallet transactions in the current period.
          Transactions will appear here once they are made.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
