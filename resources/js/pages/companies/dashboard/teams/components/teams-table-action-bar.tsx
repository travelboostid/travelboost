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
import { FormattedMessage, useIntl } from 'react-intl';
import { toast } from 'sonner';
import type { TeamMemberRow } from '../index';

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
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [updating, setUpdating] = React.useState(false);
    const [deleteOpen, setDeleteOpen] = React.useState(false);
    const rows = table
        .getFilteredSelectedRowModel()
        .rows.filter((row) => isBulkSelectable(row.original));

    const teamStatusOptions = React.useMemo(
        () => [
            {
                label: intl.formatMessage({ defaultMessage: 'Active' }),
                value: 'active',
            },
            {
                label: intl.formatMessage({ defaultMessage: 'Suspended' }),
                value: 'suspended',
            },
        ],
        [intl],
    );

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
                        intl.formatMessage(
                            {
                                defaultMessage:
                                    'Status updated to {status} for {count, plural, one {# member} other {# members}}',
                            },
                            { status, count: rows.length },
                        ),
                    );
                    table.toggleAllRowsSelected(false);
                },
                onError: () => {
                    toast.error(
                        intl.formatMessage({
                            defaultMessage: 'Failed to update team members',
                        }),
                    );
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
                toast.success(
                    intl.formatMessage(
                        {
                            defaultMessage:
                                'Removed {count, plural, one {# team member} other {# team members}}',
                        },
                        { count: rows.length },
                    ),
                );
                table.toggleAllRowsSelected(false);
            },
            onError: () => {
                toast.error(
                    intl.formatMessage({
                        defaultMessage: 'Failed to remove team members',
                    }),
                );
            },
        });
    };

    return (
        <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
            <ActionBarSelection>
                <span className="font-medium">{rows.length}</span>
                <span>
                    <FormattedMessage defaultMessage="selected" />
                </span>
                <ActionBarSeparator />
                <ActionBarClose>
                    <X />
                </ActionBarClose>
            </ActionBarSelection>
            <ActionBarSeparator />
            <ActionBarGroup>
                <BulkUpdateMenu
                    disabled={updating}
                    options={teamStatusOptions}
                    onSelect={handleBulkUpdate}
                />

                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <AlertDialogTrigger asChild>
                        <ActionBarItem disabled={updating}>
                            <Trash2Icon />
                            <FormattedMessage defaultMessage="Remove" />
                        </ActionBarItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                <FormattedMessage defaultMessage="Remove selected members?" />
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                <FormattedMessage
                                    defaultMessage="This will remove {count, plural, one {# team member} other {# team members}} from your company."
                                    values={{ count: rows.length }}
                                />
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>
                                <FormattedMessage defaultMessage="Cancel" />
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleBulkDelete}>
                                <FormattedMessage defaultMessage="Remove" />
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </ActionBarGroup>
        </ActionBar>
    );
}
