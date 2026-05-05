import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useAvailableDashboards } from '../components/hooks';

export function NavUser() {
  const { auth } = usePageSharedDataProps();
  const dashboards = useAvailableDashboards();
  const defaultDashboard = useMemo(() => {
    if (auth.roles.includes('user:admin')) {
      return dashboards.find((d) => d.id === 'admin:default') || dashboards[0];
    } else {
      return (
        dashboards.find((d) => d.id.startsWith('company:')) || dashboards[0]
      );
    }
  }, [auth.roles, dashboards]);
  return (
    <Button asChild variant="ghost" className="gap-2 px-2">
      <Link href={defaultDashboard.baseUrl}>
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
