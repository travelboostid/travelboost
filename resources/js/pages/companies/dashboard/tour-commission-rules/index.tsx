import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router } from '@inertiajs/react';
import { SaveIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import type {
    BaseRuleDraft,
    ProductCommissionCategory,
    Rule,
    SortDirection,
    Tier,
} from './shared';
import {
    categoryName,
    CommissionFields,
    PaginationControls,
    SortableHeader,
} from './shared';

function baseRuleKey(tierId: number, categoryId: number): string {
    return `${tierId}-${categoryId}`;
}

function baseRuleDraft(rule?: Rule): BaseRuleDraft {
    return {
        commission_type: rule?.commission_type ?? 'nominal',
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
    const [sortKey, setSortKey] = useState<'default' | 'tier' | 'category'>(
        'default',
    );
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [drafts, setDrafts] = useState<Record<string, BaseRuleDraft>>({});
    const [rowProcessingKey, setRowProcessingKey] = useState<string | null>(
        null,
    );
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const pageSize = 10;
    const tableRows = useMemo(() => {
        const baseRows = tiers.flatMap((tier) =>
            categories.map((category) => ({ tier, category })),
        );

        if (sortKey === 'default') {
            return baseRows;
        }

        return [...baseRows].sort((a, b) => {
            if (sortKey === 'tier') {
                const comparison = a.tier.name.localeCompare(b.tier.name);
                return sortDirection === 'asc' ? comparison : -comparison;
            } else if (sortKey === 'category') {
                const comparison = categoryName(a.category).localeCompare(
                    categoryName(b.category),
                );
                return sortDirection === 'asc' ? comparison : -comparison;
            }
            return 0;
        });
    }, [categories, tiers, sortKey, sortDirection]);
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
                                    onClick={() => {
                                        if (sortKey === 'tier') {
                                            setSortDirection((value) =>
                                                value === 'asc'
                                                    ? 'desc'
                                                    : 'asc',
                                            );
                                        } else {
                                            setSortKey('tier');
                                            setSortDirection('asc');
                                        }
                                    }}
                                >
                                    <FormattedMessage defaultMessage="Agent Category" />
                                </SortableHeader>
                            </TableHead>
                            <TableHead>
                                <SortableHeader
                                    onClick={() => {
                                        if (sortKey === 'category') {
                                            setSortDirection((value) =>
                                                value === 'asc'
                                                    ? 'desc'
                                                    : 'asc',
                                            );
                                        } else {
                                            setSortKey('category');
                                            setSortDirection('asc');
                                        }
                                    }}
                                >
                                    <FormattedMessage defaultMessage="Product Commission Category" />
                                </SortableHeader>
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
                        {tiers.length === 0 || categories.length === 0 ? (
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

export default function Page({
    agentTiers,
    productCommissionCategories,
    rules,
}: {
    agentTiers: Tier[];
    productCommissionCategories: ProductCommissionCategory[];
    rules: Rule[];
}) {
    return (
        <CompanyDashboardLayout
            breadcrumb={[
                {
                    title: 'Commission Setup',
                },
                {
                    title: 'Base Commission Rules',
                },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.tour-rules']}
            containerClassName="w-full flex-1 bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-20 md:p-8">
                <BaseMatrixPage
                    tiers={agentTiers}
                    categories={productCommissionCategories}
                    rules={rules}
                />
            </div>
        </CompanyDashboardLayout>
    );
}
