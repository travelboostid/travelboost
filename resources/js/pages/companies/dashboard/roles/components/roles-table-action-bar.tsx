'use client';

import {
    ActionBar,
    ActionBarClose,
    ActionBarGroup,
    ActionBarItem,
    ActionBarSelection,
    ActionBarSeparator,
} from '@/components/ui/action-bar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import type { Table } from '@tanstack/react-table';
import { DownloadIcon, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';
import type { RoleRow } from '../index';
import { downloadRolesCsv } from './export-roles-csv';

type RolesTableActionBarProps = {
    table: Table<RoleRow>;
};

export default function RolesTableActionBar({
    table,
}: RolesTableActionBarProps) {
    const { company } = usePageSharedDataProps();
    const rows = table.getFilteredSelectedRowModel().rows;

    const handleExportCsv = () => {
        downloadRolesCsv(
            rows.map((row) => row.original),
            company.id,
        );
    };

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
                <ActionBarItem
                    onSelect={(event) => event.preventDefault()}
                    onClick={handleExportCsv}
                >
                    <DownloadIcon />
                    <FormattedMessage defaultMessage="Export CSV" />
                </ActionBarItem>
            </ActionBarGroup>
        </ActionBar>
    );
}
