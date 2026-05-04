import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';

export function DefaultLayoutNavUser() {
  const { auth } = usePageSharedDataProps();

  return (
    <Button asChild variant="ghost" className="gap-2 px-2">
      <Link href={'/me'}>
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
