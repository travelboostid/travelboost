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

import { update } from '@/routes/admin/funds/bank-accounts';
import { useForm } from '@inertiajs/react';
import { CheckIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ApproveButton({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        status: 'verified',
    });

    const handleSubmit = () => {
        form.put(update(data.id).url, {
            onSuccess: () => {
                setOpen(false);
                toast.success('Bank account approved successfully');
            },
            onError: (err) => {
                toast.error('Failed to approve bank account', {
                    description:
                        err.status ||
                        'An unexpected error occurred. Check the logs for more details.',
                });
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="default">
                    <CheckIcon />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will mark this bank account as approved and
                        verify the account. User will be notified about the
                        approval.
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
