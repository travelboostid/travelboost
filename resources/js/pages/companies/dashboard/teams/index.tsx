'use client';

import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DEFAULT_PHOTO } from '@/config';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  PlusIcon,
  ShieldBanIcon,
  Trash2Icon,
  UserIcon,
  UserPenIcon,
} from 'lucide-react';
import DeleteInvitationDialog from './components/delete-invitation-dialog';
import InviteDialog from './components/invite-dialog';
dayjs.extend(relativeTime);

const MemberRow = ({ member }: { member: any }) => {
  console.log(member);
  return (
    <TableRow key={member.id} className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 flex gap-2 items-center">
        <Avatar className="h-8 w-8 rounded-lg">
          <AvatarImage
            src={member.user.photo_url || DEFAULT_PHOTO}
            alt={member.user.name}
          />
          <AvatarFallback>
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{member.user.name}</div>
          <div className="text-sm text-muted-foreground">
            {member.user.username}
          </div>
        </div>
      </TableCell>
      <TableCell className="h-16 px-4 font-medium">
        {member.user.email}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        <Badge>{member.role}</Badge>
      </TableCell>
      <TableCell className="h-16 px-4">
        <Badge>active</Badge>
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {dayjs(member.created_at).fromNow()}
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                disabled={member.role === 'superadmin'}
                aria-label="Delete"
              >
                <Trash2Icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={member.role === 'superadmin'}
                aria-label="Suspend"
              >
                <ShieldBanIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Suspend</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={member.role === 'superadmin'}
                aria-label="Edit"
              >
                <UserPenIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

const MemberInvitationRow = ({ invitation }: { invitation: any }) => {
  return (
    <TableRow key={invitation.id} className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 flex gap-2 items-center">
        {invitation.user ? (
          <>
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage
                src={invitation.user?.photo_url || DEFAULT_PHOTO}
                alt={invitation.user?.email}
              />
              <AvatarFallback>
                <UserIcon />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{invitation.user?.name}</div>
              <div className="text-sm text-muted-foreground">
                {invitation.user?.email}
              </div>
            </div>
          </>
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell className="h-16 px-4 font-medium">
        {invitation.email}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        <Badge>{invitation.role}</Badge>
      </TableCell>
      <TableCell className="h-16 px-4">
        <Badge>pending</Badge>
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {dayjs(invitation.created_at).fromNow()}
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger>
              <DeleteInvitationDialog invitation={invitation}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Edit"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </DeleteInvitationDialog>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function Members({
  members,
  invitations,
}: {
  members: any[];
  invitations: any[];
}) {
  return (
    <CompanyDashboardLayout
      containerClassName="p-4"
      breadcrumb={[{ title: 'Settings' }, { title: 'User Management' }]}
      applet={
        <InviteDialog>
          <Button>
            <PlusIcon />
            Invite new user
          </Button>
        </InviteDialog>
      }
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
              <MemberRow key={member.id} member={member} />
            ))}
            {invitations.map((invitation) => (
              <MemberInvitationRow invitation={invitation} />
            ))}
          </TableBody>
        </Table>
      </div>
    </CompanyDashboardLayout>
  );
}
