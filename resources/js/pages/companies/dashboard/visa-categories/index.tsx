import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    EditIcon,
    MoreHorizontal,
    PlusIcon,
    TrashIcon,
    XIcon,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';

type VisaCategoryItem = {
    id?: number;
    description: string;
    price: number | string;
    is_taxable: boolean;
};

type VisaCategory = {
    id: number;
    name: string;
    items: VisaCategoryItem[];
};

const currencyFormatter = new Intl.NumberFormat('id-ID');

const buildVisaCategoryFormState = (
    category?: VisaCategory,
): { name: string; items: VisaCategoryItem[] } => ({
    name: category?.name ?? '',
    items: category?.items.map((item) => ({
        description: item.description,
        price: Number(item.price || 0),
        is_taxable: item.is_taxable,
    })) ?? [{ description: '', price: 0, is_taxable: true }],
});

function VisaCategoryFormDialog({
    category,
    children,
}: {
    category?: VisaCategory;
    children: React.ReactNode;
}) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm<{
        name: string;
        items: VisaCategoryItem[];
    }>(buildVisaCategoryFormState(category));

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);

        if (nextOpen) {
            form.setData(buildVisaCategoryFormState(category));
        }
    };

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.setData(buildVisaCategoryFormState(category));
                setOpen(false);
            },
        };

        if (category) {
            form.put(
                `/companies/${company.username}/dashboard/visa-categories/${category.id}`,
                options,
            );

            return;
        }

        form.post(
            `/companies/${company.username}/dashboard/visa-categories`,
            options,
        );
    };

    const updateItem = (
        index: number,
        field: keyof VisaCategoryItem,
        value: string | number | boolean,
    ) => {
        form.setData(
            'items',
            form.data.items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const addItem = () => {
        form.setData('items', [
            ...form.data.items,
            { description: '', price: 0, is_taxable: true },
        ]);
    };

    const removeItem = (index: number) => {
        if (form.data.items.length === 1) {
            return;
        }

        form.setData(
            'items',
            form.data.items.filter((_, itemIndex) => itemIndex !== index),
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Edit Visa Category' : 'Add Visa Category'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="visa-category-name">
                            Visa Category Name
                        </Label>
                        <Input
                            id="visa-category-name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Visa Group A"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Visa Items
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Add visa names, prices, and tax status for
                                    this category.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                            >
                                <PlusIcon className="h-4 w-4" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {form.data.items.map((item, index) => (
                                <div
                                    key={`${category?.id ?? 'new'}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                                >
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.7fr)_180px_auto]">
                                        <div className="grid gap-2">
                                            <Label>Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'description',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="VOA"
                                            />
                                            <InputError
                                                message={
                                                    form.errors[
                                                        `items.${index}.description`
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Price</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={item.price}
                                                onChange={(event) =>
                                                    updateItem(
                                                        index,
                                                        'price',
                                                        Number(
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                placeholder="600000"
                                            />
                                            <InputError
                                                message={
                                                    form.errors[
                                                        `items.${index}.price`
                                                    ]
                                                }
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>Tax Status</Label>
                                            <div className="flex h-10 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    Taxable
                                                </span>
                                                <Switch
                                                    checked={item.is_taxable}
                                                    onCheckedChange={(
                                                        checked,
                                                    ) =>
                                                        updateItem(
                                                            index,
                                                            'is_taxable',
                                                            checked,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-end">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    removeItem(index)
                                                }
                                                disabled={
                                                    form.data.items.length === 1
                                                }
                                            >
                                                <XIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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

function DeleteVisaCategoryButton({ category }: { category: VisaCategory }) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);

    return (
        <>
            <DropdownMenuItem
                onSelect={(event) => {
                    event.preventDefault();
                    setOpen(true);
                }}
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
            >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete
            </DropdownMenuItem>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Visa Category
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {category.name} if it
                            is not used by any tours.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                router.delete(
                                    `/companies/${company.username}/dashboard/visa-categories/${category.id}`,
                                    { preserveScroll: true },
                                )
                            }
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export default function Page({
    visaCategories,
}: {
    visaCategories: VisaCategory[];
}) {
    const { errors } = usePage().props as any;

    const categories = useMemo(
        () =>
            [...visaCategories].sort((first, second) =>
                first.name.localeCompare(second.name),
            ),
        [visaCategories],
    );

    return (
        <CompanyDashboardLayout
            breadcrumb={[{ title: 'Tours' }, { title: 'Visa Categories' }]}
            openMenuIds={['tours']}
            activeMenuIds={['tours.visa-categories']}
            applet={
                <VisaCategoryFormDialog>
                    <Button>
                        <PlusIcon className="h-4 w-4" />
                        Add Visa Category
                    </Button>
                </VisaCategoryFormDialog>
            }
        >
            <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 p-4 pb-20 md:p-6">
                {errors.delete_error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {errors.delete_error}
                    </div>
                )}

                <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-pink-50/40 to-white p-6 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                            <p className="text-sm font-medium uppercase tracking-[0.22em] text-primary">
                                Travel Documents
                            </p>
                            <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-slate-100">
                                Visa Categories
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Group visa services into reusable categories so
                                every tour can show a clear visa option summary
                                to vendors and agents.
                            </p>
                        </div>
                    </div>
                </section>

                {categories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950">
                        No visa categories yet. Add your first visa category to
                        start linking it to tours.
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-4">
                        {categories.map((category) => {
                            const taxableCount = category.items.filter(
                                (item) => item.is_taxable,
                            ).length;
                            const nonTaxableCount =
                                category.items.length - taxableCount;

                            return (
                                <AccordionItem
                                    key={category.id}
                                    value={String(category.id)}
                                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                                >
                                    <div className="flex items-stretch gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
                                        <AccordionTrigger
                                            hideChevron
                                            className="group flex flex-1 items-start py-0 pr-2 text-left hover:no-underline"
                                        >
                                            <div className="min-w-0 flex-1 pr-4 text-left">
                                                <div className="flex min-w-0 flex-wrap items-center gap-3">
                                                    <h2 className="min-w-0 break-words text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                        {category.name}
                                                    </h2>
                                                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                                                        {category.items.length}{' '}
                                                        item
                                                        {category.items.length >
                                                        1
                                                            ? 's'
                                                            : ''}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                    <span>
                                                        Taxable: {taxableCount}
                                                    </span>
                                                    <span>
                                                        Non-taxable:{' '}
                                                        {nonTaxableCount}
                                                    </span>
                                                </div>
                                            </div>
                                        </AccordionTrigger>

                                        <div className="flex shrink-0 flex-col items-center gap-2">
                                            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 rounded-xl"
                                                >
                                                    <VisaCategoryFormDialog
                                                        category={category}
                                                    >
                                                        <DropdownMenuItem
                                                            onSelect={(event) =>
                                                                event.preventDefault()
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <EditIcon className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                    </VisaCategoryFormDialog>
                                                    <DeleteVisaCategoryButton
                                                        category={category}
                                                    />
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <AccordionContent className="p-5">
                                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
                                            <div className="hidden grid-cols-[minmax(0,1.5fr)_180px_160px] gap-4 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-slate-900/70 dark:text-slate-400 md:grid">
                                                <span>Description</span>
                                                <span>Price</span>
                                                <span>Tax Status</span>
                                            </div>

                                            <div className="divide-y divide-slate-200 dark:divide-slate-800">
                                                {category.items.map(
                                                    (item, index) => (
                                                        <div
                                                            key={
                                                                item.id ??
                                                                `${category.id}-${index}`
                                                            }
                                                            className={cn(
                                                                'grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1.5fr)_180px_160px] md:items-center',
                                                                index % 2 ===
                                                                    1 &&
                                                                    'bg-slate-50/60 dark:bg-slate-900/30',
                                                            )}
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                    {
                                                                        item.description
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                                Rp{' '}
                                                                {currencyFormatter.format(
                                                                    Number(
                                                                        item.price ||
                                                                            0,
                                                                    ),
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]',
                                                                        item.is_taxable
                                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
                                                                    )}
                                                                >
                                                                    {item.is_taxable
                                                                        ? 'Taxable'
                                                                        : 'Non-taxable'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
