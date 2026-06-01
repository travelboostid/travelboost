import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
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
import { router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import {
    ArrowUpDown,
    CheckIcon,
    ChevronsUpDownIcon,
    RotateCcwIcon,
    SaveIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';

type SortDirection = 'asc' | 'desc';

type Tier = {
    id: number;
    name: string;
};

type ProductCommissionCategory = {
    id: number;
    name: string;
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
    product_commission_category_id?: number | null;
    product_commission_category?: ProductCommissionCategory | null;
    productCommissionCategory?: ProductCommissionCategory | null;
    schedules: Schedule[];
};

type Rule = {
    id: number;
    tour_id: number;
    agent_tier_id: number;
    product_commission_category_id: number;
    commission_type: 'percent' | 'nominal';
    commission_value: string | number;
    schedule_adjustments: {
        tour_schedule_id: number;
        commission_type: 'percent' | 'nominal';
        commission_value: string | number;
    }[];
};

function formatDateRange(schedule: Schedule): string {
    const departure = schedule.departure_date
        ? dayjs(schedule.departure_date).format('DD MMM YYYY')
        : '-';
    const returning = schedule.return_date
        ? dayjs(schedule.return_date).format('DD MMM YYYY')
        : null;

    return returning ? `${departure} - ${returning}` : departure;
}

function getCategoryName(category?: ProductCommissionCategory | null): string {
    return category?.name || category?.category_name || '-';
}

function getTourCategory(tour?: Tour | null): ProductCommissionCategory | null {
    return (
        tour?.product_commission_category ||
        tour?.productCommissionCategory ||
        null
    );
}

function SortableHeader({
    title,
    onClick,
}: {
    title: string;
    onClick?: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-2 text-left font-semibold text-primary"
        >
            {title}
            <ArrowUpDown className="h-4 w-4 opacity-60" />
        </button>
    );
}

function TourPicker({
    tours,
    selectedTour,
}: {
    tours: Tour[];
    selectedTour: Tour | null;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);

    const selectTour = (tourId: number) => {
        router.get(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            { tour_id: tourId },
            { preserveScroll: true },
        );
        setOpen(false);
    };

    const resetSelection = () => {
        router.get(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            {},
            { preserveScroll: true },
        );
        setOpen(false);
    };

    return (
        <div className="grid gap-2">
            <Label>Tour Product</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="h-12 w-full justify-between rounded-xl border-slate-200 bg-white px-4 text-left font-normal shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-xl"
                        >
                            <span className="truncate">
                                {selectedTour
                                    ? `${selectedTour.code} - ${selectedTour.name}`
                                    : 'Search and select tour product'}
                            </span>
                            <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-[min(640px,calc(100vw-2rem))] p-0"
                        align="start"
                    >
                        <Command>
                            <CommandInput placeholder="Search tour code or name..." />
                            <CommandList>
                                <CommandEmpty>
                                    No tour product found.
                                </CommandEmpty>
                                <CommandGroup>
                                    {tours.map((tour) => (
                                        <CommandItem
                                            key={tour.id}
                                            value={`${tour.code} ${tour.name}`}
                                            onSelect={() => selectTour(tour.id)}
                                            className="gap-3"
                                        >
                                            <CheckIcon
                                                className={cn(
                                                    'h-4 w-4',
                                                    selectedTour?.id === tour.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0',
                                                )}
                                            />
                                            <span className="font-mono text-xs text-slate-500">
                                                {tour.code}
                                            </span>
                                            <span className="truncate">
                                                {tour.name}
                                            </span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button
                    type="button"
                    variant="outline"
                    onClick={resetSelection}
                    disabled={!selectedTour}
                    className="h-12 rounded-xl border-slate-200 bg-white px-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                    <RotateCcwIcon className="h-4 w-4" />
                    Reset
                </Button>
            </div>
        </div>
    );
}

function RuleRow({
    tour,
    tier,
    category,
    rule,
}: {
    tour: Tour;
    tier: Tier;
    category: ProductCommissionCategory;
    rule?: Rule;
}) {
    const { company } = usePageSharedDataProps();
    const adjustment = rule?.schedule_adjustments?.[0];
    const form = useForm({
        tour_id: tour.id,
        agent_tier_id: tier.id,
        product_commission_category_id: category.id,
        commission_type: rule?.commission_type ?? 'percent',
        commission_value: Number(rule?.commission_value ?? 0),
        adjustment_schedule_ids:
            rule?.schedule_adjustments?.map((item) => item.tour_schedule_id) ??
            [],
        adjustment_type: adjustment?.commission_type ?? 'percent',
        adjustment_value: Number(adjustment?.commission_value ?? 0),
        is_active: true,
    });

    const toggleSchedule = (scheduleId: number, checked: boolean) => {
        const current = form.data.adjustment_schedule_ids;
        form.setData(
            'adjustment_schedule_ids',
            checked
                ? [...current, scheduleId]
                : current.filter((id) => id !== scheduleId),
        );
    };

    const submit = () => {
        form.post(
            `/companies/${company.username}/dashboard/tour-commission-rules`,
            { preserveScroll: true },
        );
    };

    return (
        <TableRow className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/70">
            <TableCell className="min-w-[170px] font-semibold text-slate-800 dark:text-slate-100">
                {tier.name}
            </TableCell>
            <TableCell>
                <div className="flex min-w-[240px] gap-2">
                    <Select
                        value={form.data.commission_type}
                        onValueChange={(value: 'percent' | 'nominal') =>
                            form.setData('commission_type', value)
                        }
                    >
                        <SelectTrigger className="h-10 w-32 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="nominal">Nominal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        value={form.data.commission_value}
                        onChange={(e) =>
                            form.setData(
                                'commission_value',
                                Number(e.target.value),
                            )
                        }
                        className="h-10 rounded-xl"
                    />
                </div>
            </TableCell>
            <TableCell>
                <div className="grid min-w-[320px] gap-2">
                    {tour.schedules.length === 0 ? (
                        <span className="rounded-xl border border-dashed px-3 py-2 text-sm text-muted-foreground">
                            No schedule available.
                        </span>
                    ) : (
                        tour.schedules.map((schedule) => (
                            <label
                                key={schedule.id}
                                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950"
                            >
                                <Checkbox
                                    checked={form.data.adjustment_schedule_ids.includes(
                                        schedule.id,
                                    )}
                                    onCheckedChange={(checked) =>
                                        toggleSchedule(
                                            schedule.id,
                                            checked === true,
                                        )
                                    }
                                />
                                <span>{formatDateRange(schedule)}</span>
                            </label>
                        ))
                    )}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex min-w-[240px] gap-2">
                    <Select
                        value={form.data.adjustment_type}
                        onValueChange={(value: 'percent' | 'nominal') =>
                            form.setData('adjustment_type', value)
                        }
                    >
                        <SelectTrigger className="h-10 w-32 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="nominal">Nominal</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="number"
                        value={form.data.adjustment_value}
                        onChange={(e) =>
                            form.setData(
                                'adjustment_value',
                                Number(e.target.value),
                            )
                        }
                        className="h-10 rounded-xl"
                    />
                </div>
            </TableCell>
            <TableCell className="text-right">
                <Button
                    size="sm"
                    onClick={submit}
                    disabled={form.processing}
                    className="h-10 gap-2 rounded-xl px-4"
                >
                    <SaveIcon className="h-4 w-4" />
                    Save
                </Button>
            </TableCell>
        </TableRow>
    );
}

export default function Page({
    tours,
    selectedTour,
    agentTiers,
    productCommissionCategories,
    rules,
}: {
    tours: Tour[];
    selectedTour: Tour | null;
    agentTiers: Tier[];
    productCommissionCategories: ProductCommissionCategory[];
    rules: Rule[];
}) {
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const selectedCategory = getTourCategory(selectedTour);
    const displayedCategories =
        selectedCategory && selectedTour?.product_commission_category_id
            ? productCommissionCategories.filter(
                  (category) => category.id === selectedCategory.id,
              )
            : productCommissionCategories;

    const sortedTiers = useMemo(() => {
        return [...agentTiers].sort((a, b) => {
            const comparison = a.name.localeCompare(b.name);
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [agentTiers, sortDirection]);

    const ruleMap = useMemo(() => {
        return new Map(
            rules.map((rule) => [
                `${rule.agent_tier_id}-${rule.product_commission_category_id}`,
                rule,
            ]),
        );
    }, [rules]);

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Commission Setup' },
                { title: 'Tour Commission Rules' },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.tour-rules']}
            containerClassName="w-full flex-1 bg-slate-50/30 dark:bg-slate-950"
        >
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-20 md:p-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                        <TourPicker tours={tours} selectedTour={selectedTour} />

                        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 dark:border-primary/25 dark:bg-primary/10">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                Product Commission Category
                            </p>
                            <div className="mt-2">
                                <Badge className="rounded-full px-3 py-1 text-sm">
                                    {selectedTour
                                        ? getCategoryName(selectedCategory)
                                        : 'Select a tour first'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {!selectedTour ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                            Select a tour product
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Commission rules will appear after a tour product is
                            selected.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                        <div className="overflow-x-auto">
                            <Table className="text-sm">
                                <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="h-14 px-4">
                                            <SortableHeader
                                                title="Agent Tier"
                                                onClick={() =>
                                                    setSortDirection((value) =>
                                                        value === 'asc'
                                                            ? 'desc'
                                                            : 'asc',
                                                    )
                                                }
                                            />
                                        </TableHead>
                                        <TableHead className="h-14 px-4 font-semibold text-primary">
                                            Commission
                                        </TableHead>
                                        <TableHead className="h-14 px-4 font-semibold text-primary">
                                            Additional Commission Schedules
                                        </TableHead>
                                        <TableHead className="h-14 px-4 font-semibold text-primary">
                                            Additional Commission Value
                                        </TableHead>
                                        <TableHead className="h-14 px-4 text-right" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedTiers.length === 0 ||
                                    displayedCategories.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="h-28 text-center"
                                            >
                                                Agent tiers and a product
                                                commission category are
                                                required.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedTiers.flatMap((tier) =>
                                            displayedCategories.map(
                                                (category) => (
                                                    <RuleRow
                                                        key={`${tier.id}-${category.id}`}
                                                        tour={selectedTour}
                                                        tier={tier}
                                                        category={category}
                                                        rule={ruleMap.get(
                                                            `${tier.id}-${category.id}`,
                                                        )}
                                                    />
                                                ),
                                            ),
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
