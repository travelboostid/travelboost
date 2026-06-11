import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { update } from '@/routes/companies/dashboard/teams';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export default function TeamStatusSelect({
    team,
    canManageMembers,
}: {
    team: any;
    canManageMembers: boolean;
}) {
    const { company } = usePageSharedDataProps();
    const disabled = !canManageMembers || team.is_owner || !team.user;

    if (!team.user) {
        return (
            <span className="text-sm capitalize text-muted-foreground">
                {team.status}
            </span>
        );
    }

    return (
        <Select
            value={team.status}
            disabled={disabled}
            onValueChange={(value) =>
                router.put(
                    update({ company: company.username, team: team.id }).url,
                    { status: value },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            toast.success(`Status updated to ${value}`);
                        },
                        onError: () => {
                            toast.error('Failed to update status');
                        },
                    },
                )
            }
        >
            <SelectTrigger className="h-9 w-[132px] capitalize">
                <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
        </Select>
    );
}
