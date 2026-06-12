import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/CategoryController';
import type { TourCategoryResource } from '@/api/model';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type TourCategoryWithManualReservedLimit = TourCategoryResource & {
    manual_reserved_limit_value?: number | null;
    manual_reserved_limit_unit?: 'minute' | 'hour' | null;
};

type UpdateCategoryDialogProps = {
    category: TourCategoryWithManualReservedLimit;
    children: ReactNode;
};

export default function UpdateCategoryDialog({
    category,
    children,
}: UpdateCategoryDialogProps) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);

    const form = useForm({
        name: category.name,
        description: category.description,
        position_no: String(category.position_no ?? ''),
        manual_reserved_limit_value: String(
            category.manual_reserved_limit_value ?? 1,
        ),
        manual_reserved_limit_unit:
            category.manual_reserved_limit_unit ?? 'hour',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                name: category.name,
                description: category.description,
                position_no: String(category.position_no ?? ''),
                manual_reserved_limit_value: String(
                    category.manual_reserved_limit_value ?? 1,
                ),
                manual_reserved_limit_unit:
                    category.manual_reserved_limit_unit ?? 'hour',
            });
        }
    }, [category, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.put(
            update({ company: company.username, category: category.id }).url,
            {
                preserveScroll: true,
                onError: () => setOpen(true),
                onSuccess: () => {
                    setOpen(false);
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="sm:max-w-106.25">
                <DialogHeader>
                    <DialogTitle>Update Category</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Category Name</Label>
                        <Input
                            id="name"
                            value={form.data.name}
                            onChange={(e) =>
                                form.setData('name', e.target.value)
                            }
                            placeholder="Category name"
                        />
                        <InputError message={form.errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">
                            Category Description
                        </Label>
                        <Input
                            id="description"
                            value={form.data.description || ''}
                            onChange={(e) =>
                                form.setData('description', e.target.value)
                            }
                            placeholder="Category Description"
                        />
                        <InputError message={form.errors.description} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="position_no">Position No</Label>
                        <Input
                            id="position_no"
                            value={form.data.position_no}
                            onChange={(e) =>
                                form.setData('position_no', e.target.value)
                            }
                            placeholder="Position No"
                        />
                        <InputError message={form.errors.position_no} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="manual_reserved_limit_value">
                            Manual Reservation Duration
                        </Label>
                        <div className="grid grid-cols-[1fr_130px] gap-2">
                            <Input
                                id="manual_reserved_limit_value"
                                type="number"
                                min="1"
                                value={form.data.manual_reserved_limit_value}
                                onChange={(e) =>
                                    form.setData(
                                        'manual_reserved_limit_value',
                                        e.target.value,
                                    )
                                }
                                placeholder="1"
                            />
                            <Select
                                value={form.data.manual_reserved_limit_unit}
                                onValueChange={(value) =>
                                    form.setData(
                                        'manual_reserved_limit_unit',
                                        value,
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="minute">
                                        Minute
                                    </SelectItem>
                                    <SelectItem value="hour">Hour</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Leave this at 1 hour to use the default behavior.
                        </p>
                        <InputError
                            message={form.errors.manual_reserved_limit_value}
                        />
                        <InputError
                            message={form.errors.manual_reserved_limit_unit}
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>

                        <Button type="submit" disabled={form.processing}>
                            {form.processing && <Spinner className="mr-2" />}
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
