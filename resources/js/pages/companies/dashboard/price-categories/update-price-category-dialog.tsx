import { update } from '@/actions/App/Http/Controllers/Companies/Dashboard/PriceCategoryController';
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
import { Textarea } from '@/components/ui/textarea';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { useForm } from '@inertiajs/react';
import { PencilIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';

const ROOM_TYPES = [
    'Adult Single',
    'Adult Double',
    'Adult Twin',
    'Adult Triple',
    'Adult Quad',
    'Adult Extra Bed',
    'Child With Extra Bed',
    'Child No Bed',
    'Infant',
];

type PriceCategory = {
    id: number;
    name: string;
    room_type: string;
    description?: string;
};

type UpdatePriceCategoryDialogProps = {
    item: PriceCategory;
    children: ReactNode;
};

export default function UpdatePriceCategoryDialog({
    item,
    children,
}: UpdatePriceCategoryDialogProps) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);

    const form = useForm({
        name: item?.name,
        room_type: item?.room_type,
        description: item?.description || '',
    });

    useEffect(() => {
        if (open) {
            form.setData({
                name: item?.name,
                room_type: item?.room_type,
                description: item?.description || '',
            });
        }
    }, [item, open, form]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.put(
            update({
                company: company.username,
                price_category: item.id,
            }).url,
            {
                preserveScroll: true,
                preserveState: false,
                onError: () => setOpen(true),
                onSuccess: () => {
                    form.reset();
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
                                <FormattedMessage defaultMessage="Update price category" />
                            </DialogTitle>
                            <DialogDescription className="text-sm leading-relaxed">
                                <FormattedMessage defaultMessage="Update the price category details." />
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
                                placeholder="e.g. Standard"
                            />
                            <InputError message={form.errors.name} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="room_type">
                                <FormattedMessage defaultMessage="Room type" />
                            </Label>
                            <Select
                                value={form.data.room_type}
                                onValueChange={(value) =>
                                    form.setData('room_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select room type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ROOM_TYPES.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={form.errors.room_type} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">
                                <FormattedMessage defaultMessage="Description" />
                            </Label>
                            <Textarea
                                id="description"
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                                placeholder="Brief description of this price category"
                                rows={3}
                            />
                            <InputError message={form.errors.description} />
                        </div>
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
