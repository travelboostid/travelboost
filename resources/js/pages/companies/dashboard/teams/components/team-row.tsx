'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { DEFAULT_PHOTO } from '@/config';
import dayjs from 'dayjs';
import { UserIcon } from 'lucide-react';
import DeleteTeamButton from './delete-team-button';
import EditTeamAccountButton from './edit-team-account-button';
import TeamRoleSelect from './team-role-select';
import TeamStatusSelect from './team-status-select';

function formatDate(value: string | null) {
    if (!value) {
        return '-';
    }

    return dayjs(value).format('DD MMM YYYY, HH:mm');
}

export default function TeamRow({
    team,
    roles,
    canManageMembers,
}: {
    team: any;
    roles: any[];
    canManageMembers: boolean;
}) {
    const hasUser = Boolean(team.user);

    return (
        <TableRow className="hover:bg-muted/40">
            <TableCell className="px-4 py-4">
                {hasUser ? (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-lg">
                            <AvatarImage
                                src={team.user?.photo_url || DEFAULT_PHOTO}
                                alt={team.user?.name}
                            />
                            <AvatarFallback>
                                <UserIcon className="h-4 w-4" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium text-foreground">
                                    {team.user?.name}
                                </span>
                                {team.is_owner && <Badge>Owner</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Team account
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1">
                        <div className="font-medium text-foreground">
                            Legacy Invitation
                        </div>
                        <div className="text-sm text-muted-foreground">
                            This record is not linked to an account.
                        </div>
                    </div>
                )}
            </TableCell>

            <TableCell className="px-4 py-4 font-medium">
                {team.user?.email || team.invite_email || '-'}
            </TableCell>

            <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                {team.user?.username || '-'}
            </TableCell>

            <TableCell className="px-4 py-4">
                <TeamRoleSelect
                    team={team}
                    roles={roles}
                    canManageMembers={canManageMembers}
                />
            </TableCell>

            <TableCell className="px-4 py-4">
                <TeamStatusSelect
                    team={team}
                    canManageMembers={canManageMembers}
                />
            </TableCell>

            <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                {formatDate(team.invited_at)}
            </TableCell>

            <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                {formatDate(team.accepted_at)}
            </TableCell>

            <TableCell className="px-4 py-4">
                <div className="flex items-center gap-2">
                    {hasUser && (
                        <EditTeamAccountButton
                            team={team}
                            canManageMembers={canManageMembers}
                        />
                    )}
                    <DeleteTeamButton
                        team={team}
                        disabled={!canManageMembers}
                    />
                </div>
            </TableCell>
        </TableRow>
    );
}
