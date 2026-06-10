'use client';

import { exportAsCsv } from '@/actions/App/Http/Controllers/Admin/UserController';
import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import { bulkUpdate } from '@/routes/admin/database/users';
import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import {
    BulkStatusWithNoteDialog,
    BulkUpdateMenu,
} from '../../shared/bulk-update-actions';

const USER_STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Suspended', value: 'suspended' },
];

interface UsersTableActionBarProps {
    table: Table<any>;
}

export function UsersTableActionBar({ table }: UsersTableActionBarProps) {
    const [updating, setUpdating] = React.useState(false);
    const rows = table.getFilteredSelectedRowModel().rows;

    const onOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                table.toggleAllRowsSelected(false);
            }
        },
        [table],
    );

    const handleBulkUpdate = (
        payload: { status: string; note?: string | null },
        successMessage: string,
    ) => {
        const selectedIds = rows.map((row) => row.original.id);

        router.put(
            bulkUpdate.url(),
            {
                ids: selectedIds,
                status: payload.status,
                ...(payload.note ? { note: payload.note } : {}),
            },
            {
                preserveScroll: true,
                onBefore: () => setUpdating(true),
                onFinish: () => setUpdating(false),
                onSuccess: () => {
                    toast.success(successMessage);
                },
                onError: () => {
                    toast.error('Failed to update users');
                },
            },
        );
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
                    options={USER_STATUS_OPTIONS}
                    onSelect={(status) =>
                        handleBulkUpdate(
                            { status },
                            `Status updated to ${status} for ${rows.length} user(s)`,
                        )
                    }
                />

                <BulkStatusWithNoteDialog
                    disabled={updating}
                    selectedCount={rows.length}
                    entityLabel="user"
                    statusOptions={USER_STATUS_OPTIONS}
                    onSubmit={({ status, note }) =>
                        handleBulkUpdate(
                            { status, note: note || null },
                            `Status updated to ${status} for ${rows.length} user(s)`,
                        )
                    }
                />

                <ActionBarItem asChild>
                    <a
                        target="_blank"
                        href={
                            exportAsCsv({
                                query: {
                                    ids: rows
                                        .map((row) => row.original.id)
                                        .join(','),
                                },
                            }).url
                        }
                    >
                        <Download />
                        Export
                    </a>
                </ActionBarItem>
            </ActionBarGroup>
        </ActionBar>
    );
}
