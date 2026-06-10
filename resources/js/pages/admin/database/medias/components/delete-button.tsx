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
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { destroy } from '@/routes/admin/database/medias';
import { useForm } from '@inertiajs/react';
import { TrashIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type DeleteButtonProps = {
    data: { id: number };
    variant?: 'icon' | 'menu';
};

export default function DeleteButton({
    data,
    variant = 'icon',
}: DeleteButtonProps) {
    const [open, setOpen] = useState(false);
    const form = useForm();

    const handleSubmit = () => {
        form.delete(destroy(data.id).url, {
            onSuccess: () => {
                toast.success('Media deleted successfully.');
                setOpen(false);
            },
            onError: () => {
                toast.error('Failed to delete media. Please try again.');
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            {variant === 'icon' ? (
                <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                        <TrashIcon />
                    </Button>
                </AlertDialogTrigger>
            ) : (
                <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onSelect={(event) => {
                        event.preventDefault();
                        setOpen(true);
                    }}
                >
                    <TrashIcon className="size-4" />
                    Delete
                </DropdownMenuItem>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this media and remove all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel disabled={form.processing}>
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={form.processing}
                    >
                        Delete
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
