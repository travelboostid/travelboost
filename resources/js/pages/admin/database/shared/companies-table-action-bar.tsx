'use client';

import { exportAsCsv as exportAgentsCsv } from '@/actions/App/Http/Controllers/Admin/AgentController';
import { exportAsCsv as exportVendorsCsv } from '@/actions/App/Http/Controllers/Admin/VendorController';
import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import type { Table } from '@tanstack/react-table';
import { Download, X } from 'lucide-react';
import * as React from 'react';
import type { AdminCompanyRow } from './company-types';

type CompaniesTableActionBarProps = {
    table: Table<AdminCompanyRow>;
    entity: 'agent' | 'vendor';
};

export function CompaniesTableActionBar({
    table,
    entity,
}: CompaniesTableActionBarProps) {
    const rows = table.getFilteredSelectedRowModel().rows;
    const exportAction =
        entity === 'agent' ? exportAgentsCsv : exportVendorsCsv;

    const onOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                table.toggleAllRowsSelected(false);
            }
        },
        [table],
    );

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
