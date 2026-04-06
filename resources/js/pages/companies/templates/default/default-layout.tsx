import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import type { WithId, WithPuckProps } from '@puckeditor/core';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { DefaultLayoutNavUser } from './default-layout-nav-user';

type DefaultLayoutProps = WithId<
  WithPuckProps<{
    [x: string]: any;
  }>
>;

export default function DefaultLayout({
  children,
  title,
  theme,
  editMode,
}: DefaultLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { auth, company } = usePageSharedDataProps();
  return (
    <div
      className={`${theme} min-h-screen bg-background text-foreground transition-colors duration-300`}
    >
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LOGO */}
            <Link href="/" className="flex items-center gap-2">
              {company?.photo_url ? (
                <img
                  src={company.photo_url}
                  alt={title}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <AppLogoIcon className="w-9 h-9 text-primary-foreground" />
              )}
              <span className="text-xl font-bold text-foreground">{title}</span>
            </Link>

            {/* DESKTOP MENU */}
            <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
              <a
                href="/"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Home
              </a>
              <a
                href="/tours"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Tours
              </a>
              <a
                href="#about-us"
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                About Us
              </a>
            </nav>

            {/* DESKTOP BUTTON */}
            <div className="hidden md:flex items-center justify-end gap-4">
              {editMode ? (
                <>
                  <Button asChild variant="ghost">
                    <Link href="#">Masuk</Link>
                  </Button>
                  <Button asChild>
                    <Link href="#">Daftar Gratis</Link>
                  </Button>
                </>
              ) : auth?.user ? (
                <DefaultLayoutNavUser />
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
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                className="p-2 text-foreground"
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
            <div className="md:hidden py-4 border-t border-border animate-in slide-in-from-top-2">
              <nav className="flex flex-col gap-4">
                <a
                  href="/"
                  className="font-bold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </a>
                <a
                  href="/tours"
                  className="font-bold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Tours
                </a>
                <a
                  href="#about-us"
                  className="font-bold text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  About Us
                </a>

                <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                  {editMode ? (
                    <>
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="#">Masuk</Link>
                      </Button>
                      <Button asChild className="w-full justify-start">
                        <Link href="#">Daftar Gratis</Link>
                      </Button>
                    </>
                  ) : auth?.user ? (
                    <DefaultLayoutNavUser />
                  ) : (
                    <>
                      <Button asChild variant="ghost" className="w-full justify-start">
                        <Link href="/login">Masuk</Link>
                      </Button>
                      <Button asChild className="w-full justify-start">
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
      <main>{children}</main>
    </div>
  );
}
