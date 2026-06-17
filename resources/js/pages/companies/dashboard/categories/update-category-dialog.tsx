import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/CategoryController';
import type { TourCategoryResource } from '@/api/model';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
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
import { PencilIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

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
    }, [category, form, open]);

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

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>

            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="space-y-3 border-b px-6 py-5 text-left">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <PencilIcon className="size-5" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-lg">
                                <FormattedMessage defaultMessage="Update category" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Update the category details." />
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="space-y-5 px-6 py-5">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                <FormattedMessage defaultMessage="Category name" />
                            </Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                                placeholder="e.g. Beach Tours"
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                <FormattedMessage defaultMessage="Description" />
                            </Label>
                            <Input
                                id="description"
                                value={form.data.description || ''}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Brief description of this category"
                            />
                            <InputError message={form.errors.description} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="position_no">
                                <FormattedMessage defaultMessage="Position number" />
                            </Label>
                            <Input
                                id="position_no"
                                value={form.data.position_no}
                                onChange={(e) =>
                                    form.setData('position_no', e.target.value)
                                }
                                placeholder="e.g. 1"
                            />
                            <InputError message={form.errors.position_no} />
                        </div>

                        {company?.type !== 'agent' && (
                            <div className="grid gap-2">
                                <Label htmlFor="manual_reserved_limit_value">
                                    <FormattedMessage defaultMessage="Manual reservation duration" />
                                </Label>
                                <div className="grid grid-cols-[1fr_130px] gap-2">
                                    <Input
                                        id="manual_reserved_limit_value"
                                        type="number"
                                        min="1"
                                        value={
                                            form.data
                                                .manual_reserved_limit_value
                                        }
                                        onChange={(e) =>
                                            form.setData(
                                                'manual_reserved_limit_value',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="1"
                                    />
                                    <Select
                                        value={
                                            form.data.manual_reserved_limit_unit
                                        }
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
                                                <FormattedMessage defaultMessage="Minute" />
                                            </SelectItem>
                                            <SelectItem value="hour">
                                                <FormattedMessage defaultMessage="Hour" />
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    <FormattedMessage defaultMessage="Leave this at 1 hour to use the default behavior." />
                                </p>
                                <InputError
                                    message={
                                        form.errors.manual_reserved_limit_value
                                    }
                                />
                                <InputError
                                    message={
                                        form.errors.manual_reserved_limit_unit
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col gap-2 border-t bg-muted/20 px-6 py-4 sm:flex-col">
                        <Button
                            type="submit"
                            size="lg"
                            className="w-full"
                            disabled={form.processing}
                        >
                            {form.processing ? (
                                <Spinner className="mr-2" />
                            ) : null}
                            <FormattedMessage defaultMessage="Save changes" />
                        </Button>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                            >
                                <FormattedMessage defaultMessage="Cancel" />
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
