'use client';

import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import { exportCsv } from '@/routes/admin/tours/orders';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import type { AdminTourOrderRow } from './tour-order-types';

type TourOrdersTableActionBarProps = {
    table: Table<AdminTourOrderRow>;
};

export function TourOrdersTableActionBar({
    table,
}: TourOrdersTableActionBarProps) {
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
