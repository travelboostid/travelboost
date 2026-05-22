import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from '@/components/ui/field';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { update } from '@/routes/admin/funds/withdrawals';
import { useForm } from '@inertiajs/react';
import { ArrowRightIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProcessButton({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        method: data.method,
        status: 'processing',
    });

    const handleSubmit = () => {
        form.put(update(data.id).url, {
            onSuccess: () => {
                setOpen(false);
                toast.success('Withdrawal processed successfully');
            },
            onError: (err) => {
                toast.error('Failed to process withdrawal', {
                    description:
                        err.status ||
                        'An unexpected error occurred. Check the logs for more details.',
                });
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <AlertDialogTrigger asChild>
                        <Button size="icon" variant="default">
                            <ArrowRightIcon />
                        </Button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Process withdrawal</p>
                </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Process Withdrawal</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will mark this withdrawal as processing.
                    </AlertDialogDescription>
                    <FieldLabel>
                        <Field orientation="horizontal">
                            <Checkbox
                                id="auto-processing-checkbox"
                                checked={form.data.method === 'auto'}
                                onCheckedChange={(v) =>
                                    form.setData(
                                        'method',
                                        v ? 'auto' : 'manual',
                                    )
                                }
                            />
                            <FieldContent>
                                <FieldTitle>Autotransfer</FieldTitle>
                                <FieldDescription>
                                    Check this option to process transfer via
                                    payment gateway. Left unchecked if you
                                    prefer to transfer manually and update
                                    manually to paid after transfer.
                                </FieldDescription>
                            </FieldContent>
                        </Field>
                    </FieldLabel>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={form.processing}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={form.processing}
                    >
                        Yes
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
