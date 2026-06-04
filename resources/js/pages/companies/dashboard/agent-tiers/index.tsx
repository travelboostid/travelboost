import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { router, useForm, usePage } from '@inertiajs/react';
import { ArrowUpDownIcon, EditIcon, PlusIcon, TrashIcon } from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

type AgentTier = {
    id: number;
    name: string;
    sort_order: number;
    is_active: boolean;
};

type SortKey = 'name' | 'sort_order' | 'is_active';
type SortDirection = 'asc' | 'desc';

function SortableHeader({
    title,
    sortKey,
    activeSortKey,
    onSort,
}: {
    title: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    onSort: (key: SortKey) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onSort(sortKey)}
            className={`inline-flex items-center gap-2 font-semibold ${
                activeSortKey === sortKey ? 'text-primary' : 'text-slate-600'
            }`}
        >
            {title}
            <ArrowUpDownIcon className="h-4 w-4 opacity-60" />
        </button>
    );
}

function TierFormDialog({
    tier,
    children,
}: {
    tier?: AgentTier;
    children: React.ReactNode;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: tier?.name ?? '',
        sort_order: tier?.sort_order ?? 0,
        is_active: tier?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (tier) {
            form.put(
                `/companies/${company.username}/dashboard/agent-tiers/${tier.id}`,
                options,
            );
            return;
        }

        form.post(
            `/companies/${company.username}/dashboard/agent-tiers`,
            options,
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {tier ? 'Edit Agent Tier' : 'Add Agent Tier'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="Whole Seller"
                        />
                        {form.errors.name && (
                            <p className="text-sm text-red-500">
                                {form.errors.name}
                            </p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label>Sort Order</Label>
                        <Input
                            type="number"
                            value={form.data.sort_order}
                            onChange={(e) =>
                                form.setData(
                                    'sort_order',
                                    Number(e.target.value),
                                )
                            }
                        />
                    </div>
                    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
                        <Label>Active</Label>
                        <Switch
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked)
                            }
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Page({ tiers }: { tiers: AgentTier[] }) {
    const { company } = usePageSharedDataProps();
    const { errors } = usePage().props as any;
    const [sortKey, setSortKey] = useState<SortKey>('sort_order');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const sortedTiers = useMemo(() => {
        return [...tiers].sort((a, b) => {
            let comparison = 0;

            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortKey === 'is_active') {
                comparison = Number(a.is_active) - Number(b.is_active);
            } else {
                comparison = a.sort_order - b.sort_order;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [tiers, sortDirection, sortKey]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortKey(key);
        setSortDirection('asc');
    };

    const remove = (tier: AgentTier) => {
        if (!confirm('Delete this tier?')) {
            return;
        }

        router.delete(
            `/companies/${company.username}/dashboard/agent-tiers/${tier.id}`,
            { preserveScroll: true },
        );
    };

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Commission Setup' },
                { title: 'Agent Categories' },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.agent-tiers']}
            containerClassName="w-full flex-1 bg-slate-50/30 dark:bg-slate-950"
            applet={
                <TierFormDialog>
                    <Button className="rounded-xl">
                        <PlusIcon /> Add Tier
                    </Button>
                </TierFormDialog>
            }
        >
            <div className="mx-auto w-full max-w-[1400px] space-y-5 p-4 pb-20 md:p-8">
                {errors.delete_error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                        {errors.delete_error}
                    </div>
                )}
                {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                        Commission Setup
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                        Agent Tiers
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage vendor tier levels used by tour commission rules.
                    </p>
                </div> */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
                    <Table>
                        <TableHeader className="bg-slate-50/80 dark:bg-slate-900/80">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="h-14 px-4">
                                    <SortableHeader
                                        title="Name"
                                        sortKey="name"
                                        activeSortKey={sortKey}
                                        onSort={handleSort}
                                    />
                                </TableHead>
                                <TableHead className="h-14 px-4">
                                    <SortableHeader
                                        title="Sort Order"
                                        sortKey="sort_order"
                                        activeSortKey={sortKey}
                                        onSort={handleSort}
                                    />
                                </TableHead>
                                <TableHead className="h-14 px-4">
                                    <SortableHeader
                                        title="Status"
                                        sortKey="is_active"
                                        activeSortKey={sortKey}
                                        onSort={handleSort}
                                    />
                                </TableHead>
                                <TableHead className="w-28 text-right" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedTiers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center"
                                    >
                                        No agent tiers found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedTiers.map((tier) => (
                                    <TableRow
                                        key={tier.id}
                                        className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/70"
                                    >
                                        <TableCell className="font-medium">
                                            {tier.name}
                                        </TableCell>
                                        <TableCell>{tier.sort_order}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    tier.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    tier.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                        : ''
                                                }
                                            >
                                                {tier.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <TierFormDialog tier={tier}>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                    </Button>
                                                </TierFormDialog>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => remove(tier)}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </CompanyDashboardLayout>
    );
}
