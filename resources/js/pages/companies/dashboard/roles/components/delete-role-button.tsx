import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { destroy } from '@/routes/companies/dashboard/roles';
import { useForm } from '@inertiajs/react';
import { Trash2Icon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { isProtectedCompanyRole } from './role-utils';

export default function DeleteRoleButton({ role }: { role: any }) {
    const { company } = usePageSharedDataProps();
    const [open, setOpen] = useState(false);
    const form = useForm();

    if (isProtectedCompanyRole(role.name)) {
        return null;
    }

    const handleDelete = () => {
        form.delete(destroy({ company: company.username, role: role.id }).url, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                toast.success('Role deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete role');
            },
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-destructive"
                    aria-label="Delete role"
                >
                    <Trash2Icon className="size-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        Delete {role.display_name}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete the role. This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
