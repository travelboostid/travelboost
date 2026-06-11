'use client';

import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { BulkUpdateMenu } from '@/pages/admin/database/shared/bulk-update-actions';
import { bulkDestroy, bulkUpdate } from '@/routes/companies/dashboard/teams';
import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { Trash2Icon, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import type { TeamMemberRow } from '../index';

const TEAM_STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
];

type TeamsTableActionBarProps = {
    table: Table<TeamMemberRow>;
    canManageMembers: boolean;
};

function isBulkSelectable(row: TeamMemberRow): boolean {
    return !row.is_owner && Boolean(row.user);
}

export default function TeamsTableActionBar({
    table,
    canManageMembers,
}: TeamsTableActionBarProps) {
    const { company } = usePageSharedDataProps();
    const [updating, setUpdating] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const rows = table
        .getFilteredSelectedRowModel()
        .rows.filter((row) => isBulkSelectable(row.original));

    const onOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                table.toggleAllRowsSelected(false);
            }
        },
        [table],
    );

    if (!canManageMembers) {
        return null;
    }

    const selectedIds = rows.map((row) => row.original.id);

    const handleBulkUpdate = (status: string) => {
        router.put(
            bulkUpdate.url({ company: company.username }),
            {
                ids: selectedIds,
                status,
            },
            {
                preserveScroll: true,
                onBefore: () => setUpdating(true),
                onFinish: () => setUpdating(false),
                onSuccess: () => {
                    toast.success(
                        `Status updated to ${status} for ${rows.length} member(s)`,
                    );
                    table.toggleAllRowsSelected(false);
                },
                onError: () => {
                    toast.error('Failed to update team members');
                },
            },
        );
    };

    const handleBulkDelete = () => {
        router.delete(bulkDestroy.url({ company: company.username }), {
            data: { ids: selectedIds },
            preserveScroll: true,
            onBefore: () => setUpdating(true),
            onFinish: () => {
                setUpdating(false);
                setDeleteOpen(false);
            },
            onSuccess: () => {
                toast.success(`Removed ${rows.length} team member(s)`);
                table.toggleAllRowsSelected(false);
            },
            onError: () => {
                toast.error('Failed to remove team members');
            },
        });
    };

    return (
        <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
            <ActionBarSelection>
                <span className="font-medium">{rows.length}</span>
                <span>selected</span>
                <ActionBarSeparator />
                <ActionBarClose>
                    <X />
                </ActionBarClose>
            </ActionBarSelection>
            <ActionBarSeparator />
            <ActionBarGroup>
                <BulkUpdateMenu
                    disabled={updating}
                    options={TEAM_STATUS_OPTIONS}
                    onSelect={handleBulkUpdate}
                />

                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogTrigger asChild>
                        <ActionBarItem disabled={updating}>
                            <Trash2Icon />
                            Remove
                        </ActionBarItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Remove selected members?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will remove {rows.length} team member
                                {rows.length === 1 ? '' : 's'} from your
                                company.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete}>
                                Remove
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </ActionBarGroup>
        </ActionBar>
    );
}
