import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link, router, usePage } from '@inertiajs/react';
import { MenuIcon, XIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavUser } from './nav-user';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { auth, company } = usePageSharedDataProps();
  const { url } = usePage();

  let brandName = 'Tenant';
  try {
    const rawData = JSON.parse(company?.settings?.landing_page_data || '{}');
    if (rawData?.root?.props?.title) {
      brandName = rawData.root.props.title;
    }
  } catch {
    // ignore parse error if any
  }

  useEffect(() => {
    if (auth?.user) {
      const pendingStr = sessionStorage.getItem('pendingTourAction');
      if (pendingStr) {
        try {
          const stored = JSON.parse(pendingStr);
          if (
            stored.returnUrl &&
            window.location.pathname + window.location.search !==
              stored.returnUrl
          ) {
            router.visit(stored.returnUrl);
          }
        } catch (e) {
          console.error('Error parsing pendingTourAction:', e);
        }
      }
    }
  }, [auth?.user]);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2">
            {company?.photo_url ? (
              <img
                src={company.photo_url}
                alt={brandName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <AppLogoIcon className="w-9 h-9 text-primary-foreground" />
            )}
            <span className="text-xl font-bold text-foreground">
              {brandName}
            </span>
          </Link>

          {/* DESKTOP MENU - CENTERED */}
          <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <Link
              href="/"
              className={`transition-colors font-medium ${
                url === '/'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Home
            </Link>
            <Link
              href="/tours"
              className={`transition-colors font-medium ${
                url.startsWith('/tours')
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tours
            </Link>
            <Link
              href="/#about-us"
              className="transition-colors font-medium text-muted-foreground hover:text-foreground"
            >
              About Us
            </Link>
          </nav>

          {/* DESKTOP BUTTON - RIGHT ALIGNED */}
          <div className="hidden md:flex items-center justify-end gap-4">
            {auth?.user ? (
              <NavUser />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Masuk</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Daftar</Link>
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
              <Link
                href="/"
                className={`transition-colors font-bold ${
                  url === '/'
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/tours"
                className={`transition-colors font-bold ${
                  url.startsWith('/tours')
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Tours
              </Link>
              <Link
                href="/#about-us"
                className="transition-colors font-bold text-muted-foreground hover:text-foreground"
                onClick={() => setIsMenuOpen(false)}
              >
                About Us
              </Link>

              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                {auth?.user ? (
                  <NavUser />
                ) : (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      <Link href="/login">Masuk</Link>
                    </Button>
                    <Button asChild className="w-full justify-start">
                      <Link href="/register">Daftar</Link>
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
