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
    bulkUpdate as bulkUpdateAffiliates,
    exportCsv as exportAffiliatesCsv,
} from '@/routes/admin/database/affiliates';
import {
    bulkUpdate as bulkUpdateMasterAffiliates,
    exportCsv as exportMasterAffiliatesCsv,
} from '@/routes/admin/database/master-affiliates';
import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import type {
    AdminAffiliateRow,
    AdminMasterAffiliateRow,
} from './affiliate-types';
import {
    BulkStatusWithNoteDialog,
    BulkUpdateMenu,
} from './bulk-update-actions';

const AFFILIATE_STATUS_OPTIONS = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Suspended', value: 'suspended' },
];

type AffiliatesTableActionBarProps = {
    table: Table<AdminAffiliateRow | AdminMasterAffiliateRow>;
    entity: 'affiliate' | 'master-affiliate';
};

export function AffiliatesTableActionBar({
    table,
    entity,
}: AffiliatesTableActionBarProps) {
    const [updating, setUpdating] = React.useState(false);
    const rows = table.getFilteredSelectedRowModel().rows;
    const exportAction =
        entity === 'affiliate'
            ? exportAffiliatesCsv
            : exportMasterAffiliatesCsv;
    const bulkUpdateAction =
        entity === 'affiliate'
            ? bulkUpdateAffiliates
            : bulkUpdateMasterAffiliates;
    const entityLabel =
        entity === 'affiliate' ? 'affiliate' : 'master affiliate';

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
            bulkUpdateAction.url(),
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
                    toast.error(`Failed to update ${entityLabel}s`);
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
                    options={AFFILIATE_STATUS_OPTIONS}
                    onSelect={(status) =>
                        handleBulkUpdate(
                            { status },
                            `Status updated to ${status} for ${rows.length} ${entityLabel}(s)`,
                        )
                    }
                />

                <BulkStatusWithNoteDialog
                    disabled={updating}
                    selectedCount={rows.length}
                    entityLabel={entityLabel}
                    statusOptions={AFFILIATE_STATUS_OPTIONS}
                    onSubmit={({ status, note }) =>
                        handleBulkUpdate(
                            { status, note: note || null },
                            `Status updated to ${status} for ${rows.length} ${entityLabel}(s)`,
                        )
                    }
                />

                <ActionBarItem asChild>
                    <a
                        target="_blank"
                        href={
                            exportAction({
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
