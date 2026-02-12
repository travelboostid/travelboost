'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import type { Auth } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { MoonIcon, SunIcon, UserIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import type React from 'react';

type StdNavbarProps = {
  auth?: Auth;
};
export function StdNavbar() {
  const { auth } = usePage<StdNavbarProps>().props;
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="font-mono text-lg font-bold text-primary transition-colors hover:text-primary"
          >
            TravelBoost.co.id
          </Link>

          {/* Desktop Navigation */}
          <div className="flex items-center gap-8">
            <NavLink href="/learn-more">Learn More</NavLink>
            <NavLink href="/about">About</NavLink>
            <NavLink href="/contact">Contact</NavLink>
            <NavLink href="/privacy">Privacy</NavLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-muted"
              title="Toggle theme"
            >
              <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
          <div>
            {auth?.user ? (
              <Link href={'/dashboard'} className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src={auth.user.photo_url || DEFAULT_PHOTO}
                    alt="user"
                  />
                  <AvatarFallback>
                    <UserIcon />
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-primary">
                  {auth?.user?.name}
                </span>
              </Link>
            ) : (
              <Link href="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="font-mono text-sm text-muted-foreground transition-colors hover:text-accent"
    >
      {children}
    </a>
  );
}
