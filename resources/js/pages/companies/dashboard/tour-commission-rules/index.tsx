import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    ArrowUpDown,
    CalendarPlusIcon,
    CheckIcon,
    Layers3Icon,
    ListChecksIcon,
    MoreHorizontal,
    PencilIcon,
    PlusCircleIcon,
    SaveIcon,
    SearchIcon,
    TrashIcon,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

type CommissionType = 'percent' | 'nominal';
type SortDirection = 'asc' | 'desc';
type AdditionalSortKey = 'created_at' | 'tier' | 'scope' | 'commission';
type PageView = 'base' | 'additional';

type Tier = {
    id: number;
    name: string;
};

type ProductCommissionCategory = {
    id: number;
    name?: string;
    category_name?: string;
};

type Schedule = {
    id: number;
    departure_date: string;
    return_date: string;
};

type Tour = {
    id: number;
    code: string;
    name: string;
    schedules: Schedule[];
};

type Rule = {
    id: number;
    agent_tier_id: number;
    product_commission_category_id: number;
    commission_type: CommissionType;
    commission_value: string | number;
};

type BaseRuleDraft = {
    commission_type: CommissionType;
    commission_value: number;
};

type AdditionalRule = {
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

type ScheduleRow = {
    id: number;
    checked: boolean;
    commission_type: CommissionType;
    commission_value: number;
};

type DepartureRow = {
    key: number;
    departure_date: string;
    commission_type: CommissionType;
    commission_value: number;
};

function categoryName(category?: ProductCommissionCategory | null): string {
    return category?.name || category?.category_name || '-';
}

function formatDate(value?: string | null): string {
    return value ? dayjs(value).format('DD MMM YYYY') : '-';
}

function formatInputDate(value?: string | null): string {
    return value ? dayjs(value).format('YYYY-MM-DD') : '';
}

function formatSchedule(schedule?: Schedule | null): string {
    if (!schedule) {
        return '-';
    }

    return `${formatDate(schedule.departure_date)} - ${formatDate(schedule.return_date)}`;
}

function formatCommission(
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

function formatThousands(value: string | number): string {
    const numericValue = Number(value || 0);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return '0';
    }

    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: 0,
    }).format(numericValue);
}

function SortableHeader({
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

function PaginationControls({
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

function CommissionFields({
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
                    <SelectItem value="percent">
                        <FormattedMessage defaultMessage="Percent" />
                    </SelectItem>
                    <SelectItem value="nominal">
                        <FormattedMessage defaultMessage="Nominal" />
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

function baseRuleKey(tierId: number, categoryId: number): string {
    return `${tierId}-${categoryId}`;
}

function baseRuleDraft(rule?: Rule): BaseRuleDraft {
    return {
        commission_type: rule?.commission_type ?? 'percent',
        commission_value: Number(rule?.commission_value ?? 0),
    };
}

function baseRuleDraftChanged(
    draft?: BaseRuleDraft,
    initial?: BaseRuleDraft,
): boolean {
    if (!draft || !initial) {
        return false;
    }

    return (
        draft.commission_type !== initial.commission_type ||
        Number(draft.commission_value) !== Number(initial.commission_value)
    );
}

function BaseRuleRow({
    tier,
    category,
    draft,
    isDirty,
    isProcessing,
    onChange,
    onSave,
}: {
    tier: Tier;
    category: ProductCommissionCategory;
    draft: BaseRuleDraft;
    isDirty: boolean;
    isProcessing: boolean;
    onChange: (draft: BaseRuleDraft) => void;
    onSave: () => void;
}) {
    return (
        <TableRow className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/70">
            <TableCell className="min-w-[180px] font-semibold text-slate-800 dark:text-slate-100">
                {tier.name}
            </TableCell>
            <TableCell className="min-w-[180px] text-slate-700 dark:text-slate-200">
                {categoryName(category)}
            </TableCell>
            <TableCell>
                <CommissionFields
                    type={draft.commission_type}
                    value={draft.commission_value}
                    onTypeChange={(value) =>
                        onChange({ ...draft, commission_type: value })
                    }
                    onValueChange={(value) =>
                        onChange({ ...draft, commission_value: value })
                    }
                />
            </TableCell>
            <TableCell className="text-right">
                <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={!isDirty || isProcessing}
                    className="h-10 gap-2 rounded-xl px-4"
                >
                    <SaveIcon className="h-4 w-4" />
                    <FormattedMessage defaultMessage="Save" />
                </Button>
            </TableCell>
        </TableRow>
    );
}

function BaseMatrixPage({
    tiers,
    categories,
    rules,
}: {
    tiers: Tier[];
    categories: ProductCommissionCategory[];
    rules: Rule[];
}) {
    const { company } = usePageSharedDataProps();
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [drafts, setDrafts] = useState<Record<string, BaseRuleDraft>>({});
    const [rowProcessingKey, setRowProcessingKey] = useState<string | null>(
        null,
    );
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const pageSize = 10;
    const sortedTiers = useMemo(() => {
        return [...tiers].sort((a, b) => {
            const comparison = a.name.localeCompare(b.name);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [tiers, sortDirection]);
    const tableRows = useMemo(() => {
        return sortedTiers.flatMap((tier) =>
            categories.map((category) => ({ tier, category })),
        );
    }, [categories, sortedTiers]);
    const ruleMap = useMemo(() => {
        return new Map(
            rules.map((rule) => [
                baseRuleKey(
                    Number(rule.agent_tier_id),
                    Number(rule.product_commission_category_id),
                ),
                rule,
            ]),
        );
    }, [rules]);
    const initialDrafts = useMemo(() => {
        return Object.fromEntries(
            tableRows.map(({ tier, category }) => {
                const key = baseRuleKey(tier.id, category.id);

                return [key, baseRuleDraft(ruleMap.get(key))];
            }),
        ) as Record<string, BaseRuleDraft>;
    }, [ruleMap, tableRows]);
    const dirtyRows = useMemo(() => {
        return tableRows.filter(({ tier, category }) => {
            const key = baseRuleKey(tier.id, category.id);

            return baseRuleDraftChanged(drafts[key], initialDrafts[key]);
        });
    }, [drafts, initialDrafts, tableRows]);
    const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const visibleRows = tableRows.slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize,
    );

    useEffect(() => {
        setDrafts(initialDrafts);
    }, [initialDrafts]);

    const updateDraft = (
        tier: Tier,
        category: ProductCommissionCategory,
        draft: BaseRuleDraft,
    ) => {
        const key = baseRuleKey(tier.id, category.id);

        setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [key]: draft,
        }));
    };

    const saveRow = (tier: Tier, category: ProductCommissionCategory) => {
        const key = baseRuleKey(tier.id, category.id);
        const draft = drafts[key];

        if (!draft || !baseRuleDraftChanged(draft, initialDrafts[key])) {
            return;
        }

        router.post(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            {
                rule_type: 'base',
                agent_tier_id: tier.id,
                product_commission_category_id: category.id,
                commission_type: draft.commission_type,
                commission_value: draft.commission_value,
                is_active: true,
            },
            {
                preserveScroll: true,
                onStart: () => setRowProcessingKey(key),
                onFinish: () => setRowProcessingKey(null),
            },
        );
    };

    const saveAll = () => {
        if (dirtyRows.length === 0) {
            return;
        }

        router.post(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            {
                rule_type: 'base',
                base_items: dirtyRows.map(({ tier, category }) => {
                    const key = baseRuleKey(tier.id, category.id);
                    const draft =
                        drafts[key] ?? initialDrafts[key] ?? baseRuleDraft();

                    return {
                        agent_tier_id: tier.id,
                        product_commission_category_id: category.id,
                        commission_type: draft.commission_type,
                        commission_value: draft.commission_value,
                    };
                }),
            },
            {
                preserveScroll: true,
                onStart: () => setBulkProcessing(true),
                onFinish: () => setBulkProcessing(false),
            },
        );
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 dark:border-slate-800 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl self-start">
                    <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                        <FormattedMessage defaultMessage="Base Commission" />
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        <FormattedMessage defaultMessage="One row controls the base commission for every tour using the same product commission category and agent tier." />
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:min-w-[560px] lg:min-w-[620px]">
                    <div className="grid grid-cols-[0.92fr_1.08fr] gap-3">
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                            <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                <FormattedMessage defaultMessage="Agent Category" />
                            </span>
                            <span className="mt-1 block text-xl font-semibold text-slate-950 dark:text-slate-100">
                                {tiers.length}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900">
                            <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
                                <FormattedMessage defaultMessage="Product Comm. Categories" />
                            </span>
                            <span className="mt-1 block text-xl font-semibold text-slate-950 dark:text-slate-100">
                                {categories.length}
                            </span>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={saveAll}
                        disabled={dirtyRows.length === 0 || bulkProcessing}
                        className="h-10 gap-2 rounded-xl"
                    >
                        <SaveIcon className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Save Changes" />
                        {dirtyRows.length > 0 ? ` (${dirtyRows.length})` : ''}
                    </Button>
                </div>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                        <TableRow>
                            <TableHead>
                                <SortableHeader
                                    onClick={() =>
                                        setSortDirection((value) =>
                                            value === 'asc' ? 'desc' : 'asc',
                                        )
                                    }
                                >
                                    <FormattedMessage defaultMessage="Agent Category" />
                                </SortableHeader>
                            </TableHead>
                            <TableHead className="font-semibold text-primary">
                                <span className="inline-block max-w-[190px] leading-5">
                                    <FormattedMessage defaultMessage="Product Commission Category" />
                                </span>
                            </TableHead>
                            <TableHead className="font-semibold text-primary">
                                <FormattedMessage defaultMessage="Commission" />
                            </TableHead>
                            <TableHead className="w-[118px] text-right font-semibold text-primary">
                                <FormattedMessage defaultMessage="Actions" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTiers.length === 0 || categories.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-28 text-center text-muted-foreground"
                                >
                                    <FormattedMessage defaultMessage="Agent tiers and product commission categories are required." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRows.map(({ tier, category }) => {
                                const key = baseRuleKey(tier.id, category.id);
                                const draft =
                                    drafts[key] ??
                                    initialDrafts[key] ??
                                    baseRuleDraft();
                                const isDirty = baseRuleDraftChanged(
                                    draft,
                                    initialDrafts[key],
                                );

                                return (
                                    <BaseRuleRow
                                        key={key}
                                        tier={tier}
                                        category={category}
                                        draft={draft}
                                        isDirty={isDirty}
                                        isProcessing={
                                            bulkProcessing ||
                                            rowProcessingKey === key
                                        }
                                        onChange={(nextDraft) =>
                                            updateDraft(
                                                tier,
                                                category,
                                                nextDraft,
                                            )
                                        }
                                        onSave={() => saveRow(tier, category)}
                                    />
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls
                currentPage={safeCurrentPage}
                pageSize={pageSize}
                totalItems={tableRows.length}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

function CategoryDepartureDialog({
    tiers,
    categories,
    additionalRules,
}: {
    tiers: Tier[];
    categories: ProductCommissionCategory[];
    additionalRules: AdditionalRule[];
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState<number | ''>(
        tiers[0]?.id ?? '',
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(
        categories[0]?.id ?? '',
    );
    const [rows, setRows] = useState<DepartureRow[]>([
        {
            key: 1,
            departure_date: '',
            commission_type: 'percent',
            commission_value: 0,
        },
    ]);
    const [nextRowKey, setNextRowKey] = useState(2);
    const [processing, setProcessing] = useState(false);
    const getExistingDepartureRules = (
        tierId: number | '',
        categoryId: number | '',
    ) => {
        if (!tierId || !categoryId) {
            return [];
        }

        return additionalRules
            .filter(
                (rule) =>
                    rule.scope_type === 'category_departure' &&
                    Number(rule.agent_tier_id) === Number(tierId) &&
                    Number(rule.product_commission_category_id) ===
                        Number(categoryId),
            )
            .sort((a, b) =>
                formatInputDate(a.departure_date).localeCompare(
                    formatInputDate(b.departure_date),
                ),
            );
    };
    const existingDepartureRules = getExistingDepartureRules(
        selectedTierId,
        selectedCategoryId,
    );

    const validRows = rows.filter((row) => row.departure_date);
    const findExistingDepartureRule = (departureDate: string) =>
        existingDepartureRules.find(
            (rule) => formatInputDate(rule.departure_date) === departureDate,
        );

    const buildDepartureRows = (rules: AdditionalRule[]): DepartureRow[] => {
        if (rules.length === 0) {
            return [
                {
                    key: 1,
                    departure_date: '',
                    commission_type: 'percent',
                    commission_value: 0,
                },
            ];
        }

        return rules.map((rule, index) => ({
            key: index + 1,
            departure_date: formatInputDate(rule.departure_date),
            commission_type: rule.commission_type,
            commission_value: Number(rule.commission_value ?? 0),
        }));
    };

    const setRowsFromExistingRules = (rules: AdditionalRule[]) => {
        setRows(buildDepartureRows(rules));
        setNextRowKey(Math.max(2, rules.length + 1));
    };

    const openDepartureDialog = () => {
        setRowsFromExistingRules(existingDepartureRules);
        setOpen(true);
    };

    const changeSelectedTier = (tierId: number) => {
        setSelectedTierId(tierId);
        setRowsFromExistingRules(
            getExistingDepartureRules(tierId, selectedCategoryId),
        );
    };

    const changeSelectedCategory = (categoryId: number) => {
        setSelectedCategoryId(categoryId);
        setRowsFromExistingRules(
            getExistingDepartureRules(selectedTierId, categoryId),
        );
    };

    const addRow = () => {
        const key = nextRowKey;
        setNextRowKey((value) => value + 1);
        setRows((items) => [
            ...items,
            {
                key,
                departure_date: '',
                commission_type: 'percent',
                commission_value: 0,
            },
        ]);
    };

    const updateRow = (key: number, values: Partial<DepartureRow>) => {
        setRows((items) =>
            items.map((item) =>
                item.key === key ? { ...item, ...values } : item,
            ),
        );
    };

    const removeRow = (key: number) => {
        setRows((items) =>
            items.length === 1
                ? [
                      {
                          key: 1,
                          departure_date: '',
                          commission_type: 'percent',
                          commission_value: 0,
                      },
                  ]
                : items.filter((item) => item.key !== key),
        );
    };

    const submit = () => {
        if (!selectedTierId || !selectedCategoryId || validRows.length === 0) {
            return;
        }

        setProcessing(true);

        router.post(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            {
                rule_type: 'category_departure',
                agent_tier_id: selectedTierId,
                product_commission_category_id: selectedCategoryId,
                departure_items: validRows.map((row) => ({
                    departure_date: row.departure_date,
                    commission_type: row.commission_type,
                    commission_value: row.commission_value,
                })),
                is_active: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    setRows([
                        {
                            key: 1,
                            departure_date: '',
                            commission_type: 'percent',
                            commission_value: 0,
                        },
                    ]);
                    setNextRowKey(2);
                },
            },
        );
    };

    return (
        <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <CalendarPlusIcon className="h-[22px] w-[22px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                                <FormattedMessage defaultMessage="Departure Date Commission" />
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                <FormattedMessage defaultMessage="Set additional commission for one product commission category across one or more departure dates." />
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={openDepartureDialog}
                        className="h-11 w-full gap-2 rounded-2xl px-5 sm:w-auto sm:self-start"
                    >
                        <PlusCircleIcon className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Add Departure Commission" />
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden rounded-3xl p-0 md:w-[35vw] md:min-w-[680px]">
                    <DialogHeader className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <DialogTitle>
                            <FormattedMessage defaultMessage="Additional Commission by Departure Date" />
                        </DialogTitle>
                        <DialogDescription>
                            <FormattedMessage defaultMessage="Select an agent tier and product commission category, then add one or more departure dates with different commission values." />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="min-h-0 space-y-5 overflow-auto p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Agent Category" />
                                </Label>
                                <Select
                                    value={String(selectedTierId)}
                                    onValueChange={(value) =>
                                        changeSelectedTier(Number(value))
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tiers.map((tier) => (
                                            <SelectItem
                                                key={tier.id}
                                                value={String(tier.id)}
                                            >
                                                {tier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Product Commission Category" />
                                </Label>
                                <Select
                                    value={String(selectedCategoryId)}
                                    onValueChange={(value) =>
                                        changeSelectedCategory(Number(value))
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {categoryName(category)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                            <Table>
                                <TableHeader className="bg-slate-50 dark:bg-slate-900">
                                    <TableRow>
                                        <TableHead>
                                            <FormattedMessage defaultMessage="Departure Date" />
                                        </TableHead>
                                        <TableHead>
                                            <FormattedMessage defaultMessage="Additional Commission" />
                                        </TableHead>
                                        <TableHead className="w-24 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row, index) => (
                                        <TableRow key={row.key}>
                                            <TableCell>
                                                <Input
                                                    type="date"
                                                    value={row.departure_date}
                                                    onChange={(event) => {
                                                        const departureDate =
                                                            event.target.value;
                                                        const existingRule =
                                                            findExistingDepartureRule(
                                                                departureDate,
                                                            );

                                                        updateRow(row.key, {
                                                            departure_date:
                                                                departureDate,
                                                            commission_type:
                                                                existingRule?.commission_type ??
                                                                row.commission_type,
                                                            commission_value:
                                                                existingRule
                                                                    ? Number(
                                                                          existingRule.commission_value ??
                                                                              0,
                                                                      )
                                                                    : row.commission_value,
                                                        });
                                                    }}
                                                    className="h-10 rounded-xl"
                                                />
                                                {findExistingDepartureRule(
                                                    row.departure_date,
                                                ) && (
                                                    <p className="mt-1 text-xs font-medium text-primary">
                                                        <FormattedMessage defaultMessage="Existing rule loaded" />
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <CommissionFields
                                                    compact
                                                    type={row.commission_type}
                                                    value={row.commission_value}
                                                    onTypeChange={(value) =>
                                                        updateRow(row.key, {
                                                            commission_type:
                                                                value,
                                                        })
                                                    }
                                                    onValueChange={(value) =>
                                                        updateRow(row.key, {
                                                            commission_value:
                                                                value,
                                                        })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeRow(row.key)
                                                    }
                                                    className="rounded-xl"
                                                >
                                                    {rows.length === 1 &&
                                                    index === 0 ? (
                                                        <FormattedMessage defaultMessage="Clear" />
                                                    ) : (
                                                        <FormattedMessage defaultMessage="Remove" />
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addRow}
                            className="rounded-xl"
                        >
                            <PlusCircleIcon className="h-4 w-4" />
                            <FormattedMessage defaultMessage="Add Date" />
                        </Button>
                    </div>

                    <DialogFooter className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-xl"
                        >
                            <FormattedMessage defaultMessage="Cancel" />
                        </Button>
                        <Button
                            type="button"
                            onClick={submit}
                            disabled={
                                processing ||
                                !selectedTierId ||
                                !selectedCategoryId ||
                                validRows.length === 0
                            }
                            className="gap-2 rounded-xl"
                        >
                            <SaveIcon className="h-4 w-4" />
                            {intl.formatMessage(
                                {
                                    defaultMessage:
                                        'Save {count, plural, one {# Date} other {# Dates}}',
                                },
                                { count: validRows.length },
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
function TourScheduleDialog({
    tiers,
    tours,
    additionalRules,
}: {
    tiers: Tier[];
    tours: Tour[];
    additionalRules: AdditionalRule[];
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState<number | ''>(
        tiers[0]?.id ?? '',
    );
    const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
    const [rows, setRows] = useState<ScheduleRow[]>([]);
    const [processing, setProcessing] = useState(false);

    const selectedRows = rows.filter((row) => row.checked);
    const findExistingScheduleRule = (
        scheduleId: number,
        tierId: number | '' = selectedTierId,
    ) =>
        additionalRules.find(
            (rule) =>
                rule.scope_type === 'tour_schedule' &&
                Number(rule.agent_tier_id) === Number(tierId) &&
                Number(rule.tour_schedule_id) === Number(scheduleId),
        );

    const buildScheduleRows = (
        tour: Tour,
        tierId: number | '' = selectedTierId,
    ): ScheduleRow[] =>
        tour.schedules.map((schedule) => {
            const existingRule = findExistingScheduleRule(schedule.id, tierId);

            return {
                id: schedule.id,
                checked: Boolean(existingRule),
                commission_type: existingRule?.commission_type ?? 'percent',
                commission_value: existingRule
                    ? Number(existingRule.commission_value ?? 0)
                    : 0,
            };
        });

    const openScheduleDialog = () => {
        if (selectedTour) {
            setRows(buildScheduleRows(selectedTour));
        }

        setOpen(true);
    };

    const changeSelectedTier = (tierId: number) => {
        setSelectedTierId(tierId);

        if (selectedTour) {
            setRows(buildScheduleRows(selectedTour, tierId));
        }
    };

    const selectTour = (tour: Tour) => {
        setSelectedTour(tour);
        setRows(buildScheduleRows(tour));
    };

    const updateRow = (id: number, values: Partial<ScheduleRow>) => {
        setRows((items) =>
            items.map((item) =>
                item.id === id ? { ...item, ...values } : item,
            ),
        );
    };

    const submit = () => {
        if (!selectedTierId || !selectedTour || selectedRows.length === 0) {
            return;
        }

        setProcessing(true);

        router.post(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            {
                rule_type: 'tour_schedule',
                agent_tier_id: selectedTierId,
                tour_id: selectedTour.id,
                schedule_items: selectedRows.map((row) => ({
                    tour_schedule_id: row.id,
                    commission_type: row.commission_type,
                    commission_value: row.commission_value,
                })),
                is_active: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => {
                    setOpen(false);
                    setSelectedTour(null);
                    setRows([]);
                },
            },
        );
    };

    return (
        <>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="flex flex-col gap-5">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <ListChecksIcon className="h-[22px] w-[22px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                                <FormattedMessage defaultMessage="Tour Schedule Commission" />
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                <FormattedMessage defaultMessage="Select a tour, choose one or more schedules, then assign additional commission for the selected departures in one place." />
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        onClick={openScheduleDialog}
                        className="h-11 w-full gap-2 rounded-2xl px-5 sm:w-auto sm:self-start"
                    >
                        <PlusCircleIcon className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Add Schedule Commission" />
                    </Button>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden rounded-3xl p-0 md:w-[60vw] md:min-w-[920px] xl:min-w-[1120px]">
                    <DialogHeader className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                        <DialogTitle>
                            <FormattedMessage defaultMessage="Additional Commission by Tour Schedule" />
                        </DialogTitle>
                        <DialogDescription>
                            <FormattedMessage defaultMessage="Choose an agent tier, select a tour, then assign additional commission to one or more schedules." />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid min-h-0 flex-1 gap-0 overflow-hidden xl:grid-cols-[440px_minmax(0,1fr)]">
                        <div className="min-h-0 border-b border-slate-100 p-5 dark:border-slate-800 xl:border-r xl:border-b-0">
                            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-sm font-semibold dark:border-slate-800">
                                    <SearchIcon className="h-4 w-4 text-primary" />
                                    <FormattedMessage defaultMessage="Tour Product" />
                                </div>
                                <Command>
                                    <CommandInput
                                        placeholder={intl.formatMessage({
                                            defaultMessage:
                                                'Search tour code or name...',
                                        })}
                                    />
                                    <CommandList className="max-h-[420px]">
                                        <CommandEmpty>
                                            <FormattedMessage defaultMessage="No tour product found." />
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {tours.map((tour) => (
                                                <CommandItem
                                                    key={tour.id}
                                                    value={`${tour.code} ${tour.name}`}
                                                    onSelect={() =>
                                                        selectTour(tour)
                                                    }
                                                    className="items-start gap-3 px-3 py-3"
                                                >
                                                    <CheckIcon
                                                        className={cn(
                                                            'mt-0.5 h-4 w-4',
                                                            selectedTour?.id ===
                                                                tour.id
                                                                ? 'opacity-100'
                                                                : 'opacity-0',
                                                        )}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium">
                                                            {tour.name}
                                                        </p>
                                                        <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                            {tour.code}
                                                        </p>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </div>
                        </div>

                        <div className="min-h-0 overflow-auto p-5">
                            {selectedTour ? (
                                <div className="flex h-full min-h-0 flex-col">
                                    <div className="mb-4 grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900 md:grid-cols-[minmax(0,1fr)_220px]">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-950 dark:text-slate-100">
                                                {selectedTour.name}
                                            </p>
                                            <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                {selectedTour.code}
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>
                                                <FormattedMessage defaultMessage="Agent Tier" />
                                            </Label>
                                            <Select
                                                value={String(selectedTierId)}
                                                onValueChange={(value) =>
                                                    changeSelectedTier(
                                                        Number(value),
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="h-10 rounded-xl bg-white dark:bg-slate-950">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tiers.map((tier) => (
                                                        <SelectItem
                                                            key={tier.id}
                                                            value={String(
                                                                tier.id,
                                                            )}
                                                        >
                                                            {tier.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="min-h-0 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
                                                <TableRow>
                                                    <TableHead className="w-12" />
                                                    <TableHead>
                                                        <FormattedMessage defaultMessage="Departure Schedule" />
                                                    </TableHead>
                                                    <TableHead>
                                                        <FormattedMessage defaultMessage="Additional Commission" />
                                                    </TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedTour.schedules
                                                    .length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={3}
                                                            className="h-32 text-center text-muted-foreground"
                                                        >
                                                            <FormattedMessage defaultMessage="This tour has no schedule." />
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    selectedTour.schedules.map(
                                                        (schedule) => {
                                                            const row =
                                                                rows.find(
                                                                    (item) =>
                                                                        item.id ===
                                                                        schedule.id,
                                                                );

                                                            return (
                                                                <TableRow
                                                                    key={
                                                                        schedule.id
                                                                    }
                                                                >
                                                                    <TableCell>
                                                                        <Checkbox
                                                                            checked={
                                                                                row?.checked ??
                                                                                false
                                                                            }
                                                                            onCheckedChange={(
                                                                                checked,
                                                                            ) =>
                                                                                updateRow(
                                                                                    schedule.id,
                                                                                    {
                                                                                        checked:
                                                                                            checked ===
                                                                                            true,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <p className="font-medium">
                                                                            {formatSchedule(
                                                                                schedule,
                                                                            )}
                                                                        </p>
                                                                        {findExistingScheduleRule(
                                                                            schedule.id,
                                                                        ) && (
                                                                            <p className="mt-1 text-xs font-medium text-primary">
                                                                                <FormattedMessage defaultMessage="Existing rule loaded" />
                                                                            </p>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <CommissionFields
                                                                            compact
                                                                            type={
                                                                                row?.commission_type ??
                                                                                'percent'
                                                                            }
                                                                            value={
                                                                                row?.commission_value ??
                                                                                0
                                                                            }
                                                                            onTypeChange={(
                                                                                value,
                                                                            ) =>
                                                                                updateRow(
                                                                                    schedule.id,
                                                                                    {
                                                                                        commission_type:
                                                                                            value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            onValueChange={(
                                                                                value,
                                                                            ) =>
                                                                                updateRow(
                                                                                    schedule.id,
                                                                                    {
                                                                                        commission_value:
                                                                                            value,
                                                                                    },
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center dark:border-slate-800 dark:bg-slate-900/60">
                                    <div>
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <Layers3Icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="mt-4 font-semibold">
                                            <FormattedMessage defaultMessage="Select a tour product" />
                                        </h3>
                                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                            <FormattedMessage defaultMessage="Search from the left panel to reveal schedules and configure additional commission values." />
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            className="rounded-xl"
                        >
                            <FormattedMessage defaultMessage="Cancel" />
                        </Button>
                        <Button
                            type="button"
                            onClick={submit}
                            disabled={
                                processing ||
                                !selectedTierId ||
                                !selectedTour ||
                                selectedRows.length === 0
                            }
                            className="gap-2 rounded-xl"
                        >
                            <SaveIcon className="h-4 w-4" />
                            {intl.formatMessage(
                                {
                                    defaultMessage:
                                        'Save {count, plural, one {# Schedule} other {# Schedules}}',
                                },
                                { count: selectedRows.length },
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function AdditionalRuleEditDialog({
    rule,
    tiers,
    categories,
    open,
    onOpenChange,
    hideTrigger = false,
}: {
    rule: AdditionalRule;
    tiers: Tier[];
    categories: ProductCommissionCategory[];
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const schedule = rule.tour_schedule || rule.tourSchedule;
    const [internalOpen, setInternalOpen] = useState(false);
    const [selectedTierId, setSelectedTierId] = useState<number>(
        rule.agent_tier_id,
    );
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(
        rule.product_commission_category_id ?? '',
    );
    const [departureDate, setDepartureDate] = useState(
        formatInputDate(rule.departure_date),
    );
    const [commissionType, setCommissionType] = useState<CommissionType>(
        rule.commission_type,
    );
    const [commissionValue, setCommissionValue] = useState(
        Number(rule.commission_value ?? 0),
    );
    const [processing, setProcessing] = useState(false);
    const isOpen = open ?? internalOpen;
    const setDialogOpen = onOpenChange ?? setInternalOpen;

    const resetForm = () => {
        setSelectedTierId(rule.agent_tier_id);
        setSelectedCategoryId(rule.product_commission_category_id ?? '');
        setDepartureDate(formatInputDate(rule.departure_date));
        setCommissionType(rule.commission_type);
        setCommissionValue(Number(rule.commission_value ?? 0));
    };

    const submit = () => {
        if (
            rule.scope_type === 'category_departure' &&
            (!selectedCategoryId || !departureDate)
        ) {
            return;
        }

        setProcessing(true);

        router.put(
            `/companies/${company.username}/dashboard/tour-commission-rules/additional/${rule.id}`,
            {
                agent_tier_id: selectedTierId,
                product_commission_category_id:
                    rule.scope_type === 'category_departure'
                        ? selectedCategoryId
                        : null,
                departure_date:
                    rule.scope_type === 'category_departure'
                        ? departureDate
                        : null,
                commission_type: commissionType,
                commission_value: commissionValue,
                is_active: true,
            },
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => setDialogOpen(false),
            },
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(value) => {
                if (value) {
                    resetForm();
                }

                setDialogOpen(value);
            }}
        >
            {!hideTrigger && (
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setDialogOpen(true)}
                    className="h-9 w-full justify-start rounded-lg px-3"
                >
                    <PencilIcon className="h-4 w-4" />
                    <FormattedMessage defaultMessage="Edit" />
                </Button>
            )}
            <DialogContent className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-none flex-col overflow-hidden rounded-3xl p-0 sm:max-w-xl">
                <DialogHeader className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                    <DialogTitle>
                        <FormattedMessage defaultMessage="Edit Additional Commission" />
                    </DialogTitle>
                    <DialogDescription>
                        <FormattedMessage defaultMessage="Update the selected additional commission rule." />
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-5 overflow-auto p-6">
                    <div className="grid gap-2">
                        <Label>
                            <FormattedMessage defaultMessage="Agent Tier" />
                        </Label>
                        <Select
                            value={String(selectedTierId)}
                            onValueChange={(value) =>
                                setSelectedTierId(Number(value))
                            }
                        >
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {tiers.map((tier) => (
                                    <SelectItem
                                        key={tier.id}
                                        value={String(tier.id)}
                                    >
                                        {tier.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {rule.scope_type === 'category_departure' ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Product Commission Category" />
                                </Label>
                                <Select
                                    value={String(selectedCategoryId)}
                                    onValueChange={(value) =>
                                        setSelectedCategoryId(Number(value))
                                    }
                                >
                                    <SelectTrigger className="h-11 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {categoryName(category)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>
                                    <FormattedMessage defaultMessage="Departure Date" />
                                </Label>
                                <Input
                                    type="date"
                                    value={departureDate}
                                    onChange={(event) =>
                                        setDepartureDate(event.target.value)
                                    }
                                    className="h-11 rounded-xl"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-900/70">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {rule.tour
                                    ? `${rule.tour.code} - ${rule.tour.name}`
                                    : intl.formatMessage({
                                          defaultMessage: 'Tour Schedule',
                                      })}
                            </p>
                            <p className="mt-1 text-muted-foreground">
                                {formatSchedule(schedule)}
                            </p>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label>
                            <FormattedMessage defaultMessage="Additional Commission" />
                        </Label>
                        <CommissionFields
                            type={commissionType}
                            value={commissionValue}
                            onTypeChange={setCommissionType}
                            onValueChange={setCommissionValue}
                        />
                    </div>
                </div>

                <DialogFooter className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="rounded-xl"
                    >
                        <FormattedMessage defaultMessage="Cancel" />
                    </Button>
                    <Button
                        type="button"
                        onClick={submit}
                        disabled={
                            processing ||
                            !selectedTierId ||
                            (rule.scope_type === 'category_departure' &&
                                (!selectedCategoryId || !departureDate))
                        }
                        className="gap-2 rounded-xl"
                    >
                        <SaveIcon className="h-4 w-4" />
                        <FormattedMessage defaultMessage="Save Changes" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function AdditionalRuleActions({
    rule,
    tiers,
    categories,
    onDelete,
}: {
    rule: AdditionalRule;
    tiers: Tier[];
    categories: ProductCommissionCategory[];
    onDelete: (rule: AdditionalRule) => void;
}) {
    const intl = useIntl();
    const [editOpen, setEditOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 text-secondary-foreground hover:bg-secondary/80 shadow-sm"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">
                            {intl.formatMessage({
                                defaultMessage: 'Open actions',
                            })}
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(event) => {
                            event.preventDefault();
                            setEditOpen(true);
                        }}
                    >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        <FormattedMessage defaultMessage="Edit" />
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950/40"
                        onSelect={(event) => {
                            event.preventDefault();
                            onDelete(rule);
                        }}
                    >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        <FormattedMessage defaultMessage="Delete" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AdditionalRuleEditDialog
                rule={rule}
                tiers={tiers}
                categories={categories}
                open={editOpen}
                onOpenChange={setEditOpen}
                hideTrigger
            />
        </>
    );
}

function AdditionalRulesTable({
    rules,
    tiers,
    categories,
}: {
    rules: AdditionalRule[];
    tiers: Tier[];
    categories: ProductCommissionCategory[];
}) {
    const intl = useIntl();
    const { company } = usePageSharedDataProps();
    const [sortKey, setSortKey] = useState<AdditionalSortKey>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const tierMap = useMemo(
        () => new Map(tiers.map((tier) => [tier.id, tier.name])),
        [tiers],
    );
    const categoryMap = useMemo(
        () =>
            new Map(
                categories.map((category) => [
                    category.id,
                    categoryName(category),
                ]),
            ),
        [categories],
    );
    const sortedRules = useMemo(() => {
        return [...rules].sort((a, b) => {
            const getValue = (rule: AdditionalRule) => {
                if (sortKey === 'tier') {
                    return tierMap.get(rule.agent_tier_id) ?? '';
                }

                if (sortKey === 'scope') {
                    return rule.scope_type;
                }

                if (sortKey === 'created_at') {
                    return rule.created_at
                        ? dayjs(rule.created_at).valueOf()
                        : 0;
                }

                return Number(rule.commission_value ?? 0);
            };
            const first = getValue(a);
            const second = getValue(b);
            const comparison =
                typeof first === 'number' && typeof second === 'number'
                    ? first - second
                    : String(first).localeCompare(String(second));

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [rules, sortDirection, sortKey, tierMap]);
    const totalPages = Math.max(1, Math.ceil(sortedRules.length / pageSize));
    const safeCurrentPage = Math.min(currentPage, totalPages);
    const visibleRules = sortedRules.slice(
        (safeCurrentPage - 1) * pageSize,
        safeCurrentPage * pageSize,
    );

    const updateSort = (key: AdditionalSortKey) => {
        if (sortKey === key) {
            setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortKey(key);
        setSortDirection('asc');
    };

    const deleteRule = (rule: AdditionalRule) => {
        if (
            !confirm(
                intl.formatMessage({
                    defaultMessage: 'Delete this additional commission rule?',
                }),
            )
        ) {
            return;
        }

        router.delete(
            `/companies/${company.username}/dashboard/tour-commission-rules/additional/${rule.id}`,
            { preserveScroll: true },
        );
    };

    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <h2 className="text-base font-semibold text-slate-950 dark:text-slate-100">
                    <FormattedMessage defaultMessage="Saved Additional Rules" />
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    <FormattedMessage defaultMessage="Review configured departure date and tour schedule commission rules." />
                </p>
            </div>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                        <TableRow>
                            <TableHead>
                                <SortableHeader
                                    onClick={() => updateSort('tier')}
                                >
                                    <FormattedMessage defaultMessage="Agent Category" />
                                </SortableHeader>
                            </TableHead>
                            <TableHead>
                                <SortableHeader
                                    onClick={() => updateSort('scope')}
                                >
                                    <FormattedMessage defaultMessage="Commission Type" />
                                </SortableHeader>
                            </TableHead>
                            <TableHead>
                                <FormattedMessage defaultMessage="Product Tour and Date" />
                            </TableHead>
                            <TableHead>
                                <SortableHeader
                                    onClick={() => updateSort('commission')}
                                >
                                    <FormattedMessage defaultMessage="Additional Commission" />
                                </SortableHeader>
                            </TableHead>
                            <TableHead className="w-[88px] text-right font-semibold text-primary">
                                <FormattedMessage defaultMessage="Actions" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedRules.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    <FormattedMessage defaultMessage="No additional commission rules yet." />
                                </TableCell>
                            </TableRow>
                        ) : (
                            visibleRules.map((rule) => {
                                const schedule =
                                    rule.tour_schedule || rule.tourSchedule;

                                return (
                                    <TableRow key={rule.id}>
                                        <TableCell className="font-semibold">
                                            {tierMap.get(rule.agent_tier_id) ??
                                                '-'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                                {rule.scope_type ===
                                                'category_departure' ? (
                                                    <FormattedMessage defaultMessage="Departure Date" />
                                                ) : (
                                                    <FormattedMessage defaultMessage="Tour Schedule" />
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {rule.scope_type ===
                                            'category_departure' ? (
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {categoryMap.get(
                                                            Number(
                                                                rule.product_commission_category_id,
                                                            ),
                                                        ) ?? '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            rule.departure_date,
                                                        )}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <p className="font-medium">
                                                        {rule.tour
                                                            ? `${rule.tour.code} - ${rule.tour.name}`
                                                            : '-'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatSchedule(
                                                            schedule,
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-semibold text-primary">
                                            {formatCommission(
                                                rule.commission_type,
                                                rule.commission_value,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end">
                                                <AdditionalRuleActions
                                                    rule={rule}
                                                    tiers={tiers}
                                                    categories={categories}
                                                    onDelete={deleteRule}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            <PaginationControls
                currentPage={safeCurrentPage}
                pageSize={pageSize}
                totalItems={sortedRules.length}
                onPageChange={setCurrentPage}
            />
        </div>
    );
}

function AdditionalRulesPage({
    tiers,
    categories,
    tours,
    additionalRules,
}: {
    tiers: Tier[];
    categories: ProductCommissionCategory[];
    tours: Tour[];
    additionalRules: AdditionalRule[];
}) {
    return (
        <div className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-2">
                <CategoryDepartureDialog
                    tiers={tiers}
                    categories={categories}
                    additionalRules={additionalRules}
                />
                <TourScheduleDialog
                    tiers={tiers}
                    tours={tours}
                    additionalRules={additionalRules}
                />
            </div>
            <AdditionalRulesTable
                rules={additionalRules}
                tiers={tiers}
                categories={categories}
            />
        </div>
    );
}

export default function Page({
    tours,
    agentTiers,
    productCommissionCategories,
    rules,
    additionalRules,
    view = 'base',
}: {
    tours: Tour[];
    agentTiers: Tier[];
    productCommissionCategories: ProductCommissionCategory[];
    rules: Rule[];
    additionalRules: AdditionalRule[];
    view?: PageView;
}) {
    const intl = useIntl();

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: intl.formatMessage({
                        defaultMessage: 'Commission Setup',
                    }),
                },
                {
                    title: intl.formatMessage({
                        defaultMessage:
                            view === 'base'
                                ? 'Base Commission Rules'
                                : 'Additional Commission Rules',
                    }),
                },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={[
                view === 'base'
                    ? 'commission-setup.tour-rules'
                    : 'commission-setup.additional-rules',
            ]}
            containerClassName="w-full flex-1 bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-20 md:p-8">
                {view === 'base' ? (
                    <BaseMatrixPage
                        tiers={agentTiers}
                        categories={productCommissionCategories}
                        rules={rules}
                    />
                ) : (
                    <AdditionalRulesPage
                        tiers={agentTiers}
                        categories={productCommissionCategories}
                        tours={tours}
                        additionalRules={additionalRules}
                    />
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
