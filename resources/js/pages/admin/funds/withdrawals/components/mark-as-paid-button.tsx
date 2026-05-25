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
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { update } from '@/routes/admin/funds/withdrawals';
import { useForm } from '@inertiajs/react';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function MarkAsPaidButton({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        status: 'paid',
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
                            <CheckIcon />
                        </Button>
                    </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Mark as paid</p>
                </TooltipContent>
            </Tooltip>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Mark as Paid</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will mark this withdrawal as paid. Ensure
                        you already transferred the money.
                    </AlertDialogDescription>
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
