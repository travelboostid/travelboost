import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import { ArrowUpDown } from 'lucide-react';
import type React from 'react';
import { FormattedMessage } from 'react-intl';

export type CommissionType = 'percent' | 'nominal';
export type SortDirection = 'asc' | 'desc';
export type AdditionalSortKey =
    | 'default'
    | 'created_at'
    | 'tier'
    | 'scope'
    | 'product_category'
    | 'commission';
export type PageView = 'base' | 'additional';

export type Tier = {
    id: number;
    name: string;
};

export type ProductCommissionCategory = {
    id: number;
    name?: string;
    category_name?: string;
};

export type Schedule = {
    id: number;
    departure_date: string;
    return_date: string;
};

export type Tour = {
    id: number;
    code: string;
    name: string;
    product_commission_category_id?: number | null;
    schedules: Schedule[];
};

export type Rule = {
    id: number;
    agent_tier_id: number;
    product_commission_category_id: number;
    commission_type: CommissionType;
    commission_value: string | number;
};

export type BaseRuleDraft = {
    commission_type: CommissionType;
    commission_value: number;
};

export type AdditionalRule = {
    id: number;
    agent_tier_id: number;
    product_commission_category_id?: number | null;
    tour_id?: number | null;
    tour_schedule_id?: number | null;
    departure_date?: string | null;
    scope_type: 'category_departure' | 'tour_schedule';
    commission_type: CommissionType;
    commission_value: string | number;
    created_at?: string;
    tour?: {
        id: number;
        code: string;
        name: string;
    } | null;
    tour_schedule?: Schedule | null;
    tourSchedule?: Schedule | null;
};

export type ScheduleRow = {
    id: number;
    checked: boolean;
    commission_type: CommissionType;
    commission_value: number;
};

export type DepartureRow = {
    key: number;
    departure_date: string;
    commission_type: CommissionType;
    commission_value: number;
};

export function categoryName(
    category?: ProductCommissionCategory | null,
): string {
    return category?.name || category?.category_name || '-';
}

export function formatDate(value?: string | null): string {
    return value ? dayjs(value).format('DD MMM YYYY') : '-';
}

export function formatInputDate(value?: string | null): string {
    return value ? dayjs(value).format('YYYY-MM-DD') : '';
}

export function formatSchedule(schedule?: Schedule | null): string {
    if (!schedule) {
        return '-';
    }

    return `${formatDate(schedule.departure_date)} - ${formatDate(schedule.return_date)}`;
}

export function formatCommission(
    type: CommissionType,
    value: string | number,
): string {
    const numericValue = Number(value || 0);

    if (numericValue <= 0) {
        return '-';
    }

    if (type === 'percent') {
        return `${Number(numericValue.toFixed(2))}%`;
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(numericValue);
}

export function formatThousands(value: string | number): string {
    const numericValue = Number(value || 0);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return '0';
    }

    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(numericValue);
}

export function formatDateSaveLabel(count: number): string {
    return `Save ${count} ${count === 1 ? 'Date' : 'Dates'}`;
}

export function formatScheduleSaveLabel(count: number): string {
    return `Save ${count} ${count === 1 ? 'Schedule' : 'Schedules'}`;
}

export function SortableHeader({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 text-left font-semibold text-primary"
        >
            {children}
            <ArrowUpDown className="h-4 w-4 opacity-60" />
        </button>
    );
}

export function PaginationControls({
    currentPage,
    pageSize,
    totalItems,
    onPageChange,
}: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
}) {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const startItem =
        totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-sm text-muted-foreground dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
                <FormattedMessage
                    defaultMessage="Showing {startItem} to {endItem} of {totalItems} entries"
                    values={{ startItem, endItem, totalItems }}
                />
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage <= 1}
                    onClick={() => onPageChange(safeCurrentPage - 1)}
                    className="rounded-xl"
                >
                    <FormattedMessage defaultMessage="Previous" />
                </Button>
                <span className="min-w-20 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {safeCurrentPage} / {totalPages}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={safeCurrentPage >= totalPages}
                    onClick={() => onPageChange(safeCurrentPage + 1)}
                    className="rounded-xl"
                >
                    <FormattedMessage defaultMessage="Next" />
                </Button>
            </div>
        </div>
    );
}

export function CommissionFields({
    type,
    value,
    onTypeChange,
    onValueChange,
    compact = false,
}: {
    type: CommissionType;
    value: number;
    onTypeChange: (value: CommissionType) => void;
    onValueChange: (value: number) => void;
    compact?: boolean;
}) {
    const displayValue =
        type === 'nominal' ? formatThousands(value) : String(value ?? 0);

    return (
        <div
            className={cn(
                'flex gap-2',
                compact ? 'min-w-[210px]' : 'min-w-[230px]',
            )}
        >
            <Select
                value={type}
                onValueChange={(value) => onTypeChange(value as CommissionType)}
            >
                <SelectTrigger
                    className={cn(
                        'rounded-xl',
                        compact ? 'h-9 w-28' : 'h-10 w-30',
                    )}
                >
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="nominal">
                        <FormattedMessage defaultMessage="Nominal" />
                    </SelectItem>
                    <SelectItem value="percent">
                        <FormattedMessage defaultMessage="Percent" />
                    </SelectItem>
                </SelectContent>
            </Select>
            <Input
                type="text"
                inputMode={type === 'nominal' ? 'numeric' : 'decimal'}
                value={displayValue}
                onChange={(event) => {
                    if (type === 'nominal') {
                        const numericValue = event.target.value.replace(
                            /\D/g,
                            '',
                        );
                        onValueChange(Number(numericValue || 0));
                        return;
                    }

                    const normalizedValue = event.target.value
                        .replace(',', '.')
                        .replace(/[^0-9.]/g, '');

                    onValueChange(Number(normalizedValue || 0));
                }}
                className={cn('rounded-xl', compact ? 'h-9' : 'h-10')}
            />
        </div>
    );
}
