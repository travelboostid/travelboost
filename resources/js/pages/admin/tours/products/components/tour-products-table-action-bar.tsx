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
    BulkStatusWithNoteDialog,
    BulkUpdateMenu,
} from '@/pages/admin/database/shared/bulk-update-actions';
import { bulkUpdate, exportCsv } from '@/routes/admin/tours/products';
import { router } from '@inertiajs/react';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import type { AdminTourProductRow } from './tour-product-types';

const TOUR_STATUS_OPTIONS = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
];

type TourProductsTableActionBarProps = {
    table: Table<AdminTourProductRow>;
};

export function TourProductsTableActionBar({
    table,
}: TourProductsTableActionBarProps) {
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

    const handleBulkUpdate = (status: string) => {
        const selectedIds = rows.map((row) => row.original.id);

        router.put(
            bulkUpdate.url(),
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
                        `Status updated to ${status} for ${selectedIds.length} tour(s)`,
                    );
                },
                onError: () => {
                    toast.error('Failed to update tours');
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
                    options={TOUR_STATUS_OPTIONS}
                    onSelect={handleBulkUpdate}
                />

                <BulkStatusWithNoteDialog
                    disabled={updating}
                    selectedCount={rows.length}
                    entityLabel="tour"
                    statusOptions={TOUR_STATUS_OPTIONS}
                    showNote={false}
                    onSubmit={({ status }) => handleBulkUpdate(status)}
                />

                <ActionBarItem asChild>
                    <a
                        target="_blank"
                        href={
                            exportCsv({
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
