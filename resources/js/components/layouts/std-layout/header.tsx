'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DEFAULT_PHOTO } from '@/config';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
  MenuIcon,
  MoonIcon,
  PlaneIcon,
  SunIcon,
  UserIcon,
  XIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { auth } = usePage<SharedData>().props;
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <PlaneIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              TravelBoost
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Fitur
            </a>
            <a
              href="#benefits"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Keunggulan
            </a>
            <a
              href="#testimonials"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimoni
            </a>
            <a
              href="#contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Kontak
            </a>
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
          </nav>

          {/* DESKTOP BUTTON */}

          <div className="hidden md:flex items-center gap-4">
            {auth?.user ? (
              <Link href={'/dashboard'} className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src={auth.user.photo_url || DEFAULT_PHOTO}
                    alt={auth.user.name}
                  />
                  <AvatarFallback>
                    <UserIcon />
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground">
                  {auth?.user?.name}
                </span>
              </Link>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Daftar Gratis</Link>
                </Button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <button
            type="button"
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground"
              >
                Fitur
              </a>
              <a
                href="#benefits"
                className="text-muted-foreground hover:text-foreground"
              >
                Keunggulan
              </a>
              <a
                href="#testimonials"
                className="text-muted-foreground hover:text-foreground"
              >
                Testimoni
              </a>
              <a
                href="#contact"
                className="text-muted-foreground hover:text-foreground"
              >
                Kontak
              </a>

              <div className="flex flex-col gap-2 pt-4">
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register">Daftar Gratis</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
