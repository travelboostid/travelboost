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

export default function TeamRoleSelect({
    team,
    roles,
    canManageMembers,
}: {
    team: any;
    roles: any[];
    canManageMembers: boolean;
}) {
    const { company } = usePageSharedDataProps();
    const selectedRole =
        team.roles?.[0]?.name || team.invite_role || roles[0]?.name || '';
    const disabled = !canManageMembers || team.is_owner || !team.user;

    if (!team.user) {
        return <span className="text-sm text-muted-foreground">Pending</span>;
    }

    return (
        <Select
            value={selectedRole}
            disabled={disabled}
            onValueChange={(value) =>
                router.put(
                    update({ company: company.username, team: team.id }).url,
                    { role: value },
                    {
                        preserveScroll: true,
                        onSuccess: () => {
                            const roleLabel =
                                roles.find((role) => role.name === value)
                                    ?.display_name ?? value;
                            toast.success(`Role updated to ${roleLabel}`);
                        },
                        onError: () => {
                            toast.error('Failed to update role');
                        },
                    },
                )
            }
        >
            <SelectTrigger className="h-9 w-[150px] rounded-lg border-slate-200 bg-white text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
                {roles.map((role) => (
                    <SelectItem key={role.name} value={role.name}>
                        {role.display_name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
