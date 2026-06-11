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

type CommissionCategory = {
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

function CategoryFormDialog({
    category,
    children,
}: {
    category?: CommissionCategory;
    children: React.ReactNode;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: category?.name ?? '',
        sort_order: category?.sort_order ?? 0,
        is_active: category?.is_active ?? true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (category) {
            form.put(
                `/companies/${company.username}/dashboard/product-commission-categories/${category.id}`,
                options,
            );
            return;
        }

        form.post(
            `/companies/${company.username}/dashboard/product-commission-categories`,
            options,
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="border-b px-6 py-5 text-left">
                    <DialogTitle>
                        {category
                            ? 'Edit Product Commission Category'
                            : 'Add Product Commission Category'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={submit}>
                    <div className="space-y-4 px-6 py-5">
                        <div className="grid gap-2">
                            <Label>Name</Label>
                            <Input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="Promo"
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
                    </div>
                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Page({
    categories,
}: {
    categories: CommissionCategory[];
}) {
    const { company } = usePageSharedDataProps();
    const { errors } = usePage().props as any;
    const [sortKey, setSortKey] = useState<SortKey>('sort_order');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const sortedCategories = useMemo(() => {
        return [...categories].sort((a, b) => {
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
    }, [categories, sortDirection, sortKey]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortDirection((value) => (value === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortKey(key);
        setSortDirection('asc');
    };

    const remove = (category: CommissionCategory) => {
        if (!confirm('Delete this category?')) {
            return;
        }

        router.delete(
            `/companies/${company.username}/dashboard/product-commission-categories/${category.id}`,
            { preserveScroll: true },
        );
    };

    return (
        <CompanyDashboardLayout
            breadcrumb={[
                { title: 'Commission Setup' },
                { title: 'Product Commission Categories' },
            ]}
            openMenuIds={['commission-setup']}
            activeMenuIds={['commission-setup.product-categories']}
            containerClassName="w-full flex-1 bg-slate-50/30 dark:bg-slate-950"
            applet={
                <CategoryFormDialog>
                    <Button className="rounded-xl">
                        <PlusIcon /> Add Category
                    </Button>
                </CategoryFormDialog>
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
                        Product Commission Categories
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Define the product categories used to group tour
                        commission rules.
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
                            {sortedCategories.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="h-24 text-center"
                                    >
                                        No product commission categories found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedCategories.map((category) => (
                                    <TableRow
                                        key={category.id}
                                        className="border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-900/70"
                                    >
                                        <TableCell className="font-medium">
                                            {category.name}
                                        </TableCell>
                                        <TableCell>
                                            {category.sort_order}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    category.is_active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                                className={
                                                    category.is_active
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                        : ''
                                                }
                                            >
                                                {category.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <CategoryFormDialog
                                                    category={category}
                                                >
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                    >
                                                        <EditIcon className="h-4 w-4" />
                                                    </Button>
                                                </CategoryFormDialog>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        remove(category)
                                                    }
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
