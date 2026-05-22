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

import { destroy, index } from '@/routes/admin/app-configs';
import { router, useForm } from '@inertiajs/react';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';

export default function DeleteButton({ data }: { data: any }) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        key: data.key,
        description: data.description,
        value: data.value,
    });

    const handleSubmit = () => {
        form.delete(destroy(data.id).url, {
            onSuccess: () => {
                router.push(index());
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button size="icon" variant="destructive">
                    <TrashIcon />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this app config and remove all associated data.
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
