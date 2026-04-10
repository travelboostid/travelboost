'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { DEFAULT_PHOTO } from '@/config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { UserIcon } from 'lucide-react';
import DeleteTeamButton from './delete-team-button';
import EditTeamRoleButton from './edit-team-role-button';
import ResendInvitationButton from './resend-invitation-button';
import SuspendTeamButton from './suspend-team-button';
import UnsuspendTeamButton from './unsuspend-team-button';
dayjs.extend(relativeTime);

function TeamRoles({ team }: { team: any }) {
  return (
    <div>
      {team.roles.map((role: any) => (
        <Badge key={role.id} className="mr-1 mb-1">
          {role.display_name}
        </Badge>
      ))}
    </div>
  );
}

export default function TeamRow({ team }: { team: any }) {
  return (
    <TableRow key={team.id} className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 flex gap-2 items-center">
        {team.user ? (
          <>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={team.user?.photo_url || DEFAULT_PHOTO}
                alt={team.user?.name}
              />
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {team.user?.name}{' '}
                {team.status === 'suspended' && (
                  <Badge variant="destructive">Suspended</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {team.user?.username}
              </div>
            </div>
          </>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="h-16 px-4 font-medium">
        {team.user?.email || team.invite_email}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        <TeamRoles team={team} />
      </TableCell>
      <TableCell className="h-16 px-4">
        <Badge>{team.status}</Badge>
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {dayjs(team.invited_at).fromNow()}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {team.accepted_at ? dayjs(team.accepted_at).fromNow() : '-'}
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex items-center gap-1">
          <DeleteTeamButton team={team} />
          {team.status === 'active' && <EditTeamRoleButton team={team} />}
          {team.status === 'suspended' && <UnsuspendTeamButton team={team} />}
          {team.status === 'active' && <SuspendTeamButton team={team} />}
          {team.status === 'pending' && <ResendInvitationButton team={team} />}
        </div>
      </TableCell>
    </TableRow>
  );
}
