'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import { UserIcon } from 'lucide-react';
import type { MouseEvent } from 'react';

export function NavUser({
  onNavigateAway,
}: {
  onNavigateAway?: (href: string) => void;
}) {
  const { auth } = usePageSharedDataProps();
  const href = '/me';

  const handleClick = (event: MouseEvent) => {
    if (!onNavigateAway) {
      return;
    }

    event.preventDefault();
    onNavigateAway(href);
  };

  return (
    <Button asChild variant="ghost" className="gap-2 px-2">
      <Link href={href} onClick={handleClick}>
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
