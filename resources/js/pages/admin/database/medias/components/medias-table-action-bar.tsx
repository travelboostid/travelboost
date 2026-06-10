'use client';

import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import { exportCsv } from '@/routes/admin/database/medias';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import type { AdminMediaRow } from './media-row-actions';

type MediasTableActionBarProps = {
    table: Table<AdminMediaRow>;
};

export function MediasTableActionBar({ table }: MediasTableActionBarProps) {
    const rows = table.getFilteredSelectedRowModel().rows;

    return (
        <ActionBar
            open={rows.length > 0}
            onOpenChange={(open) => {
                if (!open) {
                    table.toggleAllRowsSelected(false);
                }
            }}
        >
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
