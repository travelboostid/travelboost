import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { DEFAULT_PHOTO } from '@/config';
import { Head } from '@inertiajs/react';
import { IconExclamationCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { UserIcon } from 'lucide-react';
import AcceptInvitationButton from './components/accept-invitation-button';
import DeclineInvitationsButton from './components/decline-invitations-button';
dayjs.extend(relativeTime);

function InvitationItem({ invitation }: { invitation: any }) {
  return (
    <Item variant="outline">
      <ItemMedia>
        <Avatar className="size-10">
          <AvatarImage src={invitation.company.photo_url || DEFAULT_PHOTO} />
          <AvatarFallback>
            {' '}
            <UserIcon />
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{invitation.company.name}</ItemTitle>
        <ItemDescription>
          Invited {dayjs(invitation.created_at).fromNow()}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <AcceptInvitationButton invitation={invitation} />
      </ItemActions>
    </Item>
  );
}

export default function AcceptInvitation({
  invitations,
}: {
  invitations: any[];
}) {
  return (
    <>
      <Head title="Confirm Invitation" />
      <div className="grid gap-4">
        <div className="flex gap-2 items-center">
          <div className="flex-none">
            <IconExclamationCircle />
          </div>
          <div className="flex-1">
            <div className="font-bold text-lg">
              System detects that your email has already been invited to join a
              company.
            </div>
            <div className="text-muted-foreground">
              You can accept the invitation, or decline it. Please note that a
              single email only can be used for managing one company.
            </div>
          </div>
        </div>

        <div className="grid gap-2">
          {invitations.map((invitation) => (
            <InvitationItem key={invitation.id} invitation={invitation} />
          ))}
        </div>
        <div className="text-center">
          <DeclineInvitationsButton />
        </div>
      </div>
    </>
  );
}
