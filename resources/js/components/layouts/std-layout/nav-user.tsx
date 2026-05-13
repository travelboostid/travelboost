import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as companyDashboard } from '@/routes/companies/dashboard';
import { index as userDashboard } from '@/routes/me';
import { Link } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';

export function NavUser() {
  const { auth } = usePageSharedDataProps();
  const defaultDashboardUrl = useMemo(() => {
    const company = auth.user.companies[0];
    const dashboards = {
      'user:customer': userDashboard().url,
      'user:vendor':
        company?.username &&
        companyDashboard({ username: company.username }).url,
      'user:agent':
        company?.username &&
        companyDashboard({ username: company.username }).url,
      'user:admin': adminDashboard().url,
    } as Record<string, string>;
    const userRole =
      auth.roles.find((r) => r.startsWith('user:')) || 'user:customer';
    return dashboards[userRole] || userDashboard().url;
  }, [auth.roles, auth.user.companies]);
  return (
    <Button asChild variant="ghost" className="gap-2 px-2">
      <Link href={defaultDashboardUrl}>
        <Avatar className="size-6 rounded-lg">
          <AvatarImage
            src={auth.user.photo_url || DEFAULT_PHOTO}
            alt={auth.user.name}
          />
          <AvatarFallback className="rounded-lg">
            <UserIcon />
          </AvatarFallback>
        </Avatar>
        <div className="truncate">{auth?.user?.name}</div>
      </Link>
    </Button>
  );
}
