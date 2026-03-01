import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { NavUser } from './nav-user';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { auth } = usePageSharedDataProps();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            <AppLogoIcon className="w-9 h-9 text-primary-foreground" />
            <span className="text-xl font-bold text-foreground">Tenant</span>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </a>
            <a
              href="/tours"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Tours
            </a>
          </nav>

          {/* DESKTOP BUTTON */}

          <div className="hidden md:flex items-center gap-4">
            {auth?.user ? (
              <NavUser />
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
          <div className="flex gap-2 items-center">
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
                {auth?.user ? (
                  <NavUser />
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full">
                      <Link href="/login">Masuk</Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href="/register">Daftar Gratis</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
