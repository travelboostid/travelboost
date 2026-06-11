import InputError from '@/components/input-error';
import CompanyDashboardLayout from '@/components/layouts/company-dashboard';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { EditIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-react';
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
    }>({
        name: category?.name ?? '',
        items:
            category?.items.map((item) => ({
                description: item.description,
                price: Number(item.price),
                is_taxable: item.is_taxable,
            })) ?? [{ description: '', price: 0, is_taxable: true }],
    });

    const submit = (event: React.FormEvent) => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => setOpen(false),
        };

        if (category) {
            form.put(
                `/companies/${company.username}/dashboard/visa-categories/${category.id}`,
                options,
            );

            return;
        }

        form.post(`/companies/${company.username}/dashboard/visa-categories`, options);
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
            { description: '', price: 0, is_taxable: false },
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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {category ? 'Edit Visa Category' : 'Add Visa Category'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Visa Category Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="Visa Umum"
                        />
                        <InputError message={form.errors.name} />
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Visa Items
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Add each visa option, price, and tax setting.
                                </p>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addItem}
                            >
                                <PlusIcon className="h-4 w-4" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {form.data.items.map((item, index) => (
                                <div
                                    key={`${category?.id ?? 'new'}-${index}`}
                                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                                >
                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.8fr)_160px_auto]">
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

                                        <div className="flex items-end">
                                            <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-800">
                                                <Label>Taxable</Label>
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
            <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => setOpen(true)}
            >
                <TrashIcon className="h-4 w-4" />
            </Button>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Delete Visa Category
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove {category.name} if it is
                            not used by any tours.
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
            breadcrumb={[{ title: 'Tours' }, { title: 'Visa Category' }]}
            openMenuIds={[]}
            activeMenuIds={['visa-categories.index']}
            applet={
                <VisaCategoryFormDialog>
                    <Button>
                        <PlusIcon className="h-4 w-4" /> Add Visa Category
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

                {categories.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-950">
                        No visa categories yet. Add your first visa category to start linking it to tours.
                    </div>
                ) : (
                    <div className="space-y-5">
                        {categories.map((category) => (
                            <section
                                key={category.id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
                            >
                                <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {category.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {category.items.length} visa option
                                            {category.items.length > 1
                                                ? 's'
                                                : ''}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <VisaCategoryFormDialog
                                            category={category}
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                            >
                                                <EditIcon className="h-4 w-4" />
                                            </Button>
                                        </VisaCategoryFormDialog>
                                        <DeleteVisaCategoryButton
                                            category={category}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Description</TableHead>
                                                <TableHead className="w-[180px]">
                                                    Price
                                                </TableHead>
                                                <TableHead className="w-[160px]">
                                                    Tax Status
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {category.items.map((item, index) => (
                                                <TableRow key={item.id ?? index}>
                                                    <TableCell className="font-medium">
                                                        {item.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        Rp{' '}
                                                        {currencyFormatter.format(
                                                            Number(
                                                                item.price || 0,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.is_taxable
                                                            ? 'Taxable'
                                                            : 'Non-taxable'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </CompanyDashboardLayout>
    );
}
