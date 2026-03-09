'use client';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DEFAULT_PHOTO } from '@/config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { UserIcon } from 'lucide-react';
import DeleteTeamButton from './components/delete-team-button';
import EditTeamRoleButton from './components/edit-team-role-button';
import InviteTeamButton from './components/invite-team-button';
import ResendInvitationButton from './components/resend-invitation-button';
import SuspendTeamButton from './components/suspend-team-button';
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

function TeamRow({ team, roles }: { team: any; roles: any[] }) {
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
              <div className="font-medium">{team.user?.name}</div>
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
        {dayjs(team.created_at).fromNow()}
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex items-center gap-1">
          <DeleteTeamButton team={team} />
          {team.status !== 'pending' && (
            <>
              <EditTeamRoleButton team={team} roles={roles} />
              <SuspendTeamButton team={team} />
            </>
          )}
          {team.status === 'pending' && <ResendInvitationButton team={team} />}
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function Teams({
  members,
  roles,
}: {
  members: any[];
  roles: any[];
}) {
  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'User Management' }]}
      applet={<InviteTeamButton roles={roles} />}
    >
      <div className="rounded-lg border bg-card w-full">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="h-12 px-4 font-medium">User</TableHead>
              <TableHead className="h-12 px-4 font-medium">Email</TableHead>
              <TableHead className="h-12 px-4 font-medium w-30">Role</TableHead>
              <TableHead className="h-12 px-4 font-medium">Status</TableHead>
              <TableHead className="h-12 px-4 font-medium">
                Invited Date
              </TableHead>
              <TableHead className="h-12 px-4 font-medium w-45">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TeamRow key={member.id} team={member} roles={roles} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CompanyDashboardLayout>
  );
}
