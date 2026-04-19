import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { IconMessageCircleExclamation } from '@tabler/icons-react';

export default function EmptyChat() {
  return (
    <Empty className="p-10 border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconMessageCircleExclamation />
        </EmptyMedia>
        <EmptyTitle>You have no chats</EmptyTitle>
        <EmptyDescription>
          You have not started any chats yet. Start a new chat to see your
          messages here.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
