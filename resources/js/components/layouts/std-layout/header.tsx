import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import {
  login as loginAsAgent,
  register as registerAsAgent,
} from '@/routes/agent';
import { Link } from '@inertiajs/react';
import { MenuIcon, MoonIcon, SunIcon, XIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { NavUser } from './nav-user';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { auth } = usePageSharedDataProps();
  const { resolvedTheme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };
  const { VITE_APP_HOST, VITE_APP_PORT, VITE_APP_SCHEME } = import.meta.env;
  const affiliateBaseUrl = `${VITE_APP_SCHEME}://affiliate.${VITE_APP_HOST}${VITE_APP_PORT ? `:${VITE_APP_PORT}` : ''}`;

  const MENUS = [
    {
      name: <FormattedMessage defaultMessage="Features" id="features" />,
      href: '#features',
    },
    {
      name: <FormattedMessage defaultMessage="Benefits" id="benefits" />,
      href: '#benefits',
    },
    {
      name: (
        <FormattedMessage defaultMessage="Testimonials" id="testimonials" />
      ),
      href: '#testimonials',
    },
    {
      name: <FormattedMessage defaultMessage="Contact" id="contact" />,
      href: '#contact',
    },
    {
      name: <FormattedMessage defaultMessage="Affiliate" id="affiliate" />,
      href: affiliateBaseUrl,
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 w-full px-4 sm:px-6 lg:px-8">
          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 flex-none">
            <AppLogoIcon className="w-9 h-9 text-primary-foreground" />
            <span className="text-xl font-bold text-foreground">
              TravelBoost
            </span>
          </Link>

          {/* DESKTOP MENU */}
          <nav className="hidden md:flex items-center gap-8 flex-1 justify-center">
            {MENUS.map((menu) => (
              <a
                key={menu.href}
                href={menu.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {menu.name}
              </a>
            ))}
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

          <div className="hidden md:flex items-center gap-4 flex-none">
            {auth?.user ? (
              <NavUser />
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href={loginAsAgent()}>
                    <FormattedMessage defaultMessage="Login" />
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={registerAsAgent()}>
                    <FormattedMessage defaultMessage="Free Registration" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* MOBILE TOGGLE */}
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-foreground hover:bg-muted md:hidden"
              title="Toggle theme"
            >
              <SunIcon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle theme</span>
            </Button>
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
          <div className="md:hidden px-4 sm:px-6 lg:px-8 py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <div className="flex flex-col gap-2 pt-4">
                {auth?.user ? (
                  <NavUser />
                ) : (
                  <>
                    <Button asChild variant="ghost" className="w-full">
                      <Link href={loginAsAgent()}>
                        <FormattedMessage defaultMessage="Login" />
                      </Link>
                    </Button>
                    <Button asChild className="w-full">
                      <Link href={registerAsAgent()}>
                        <FormattedMessage defaultMessage="Free Registration" />
                      </Link>
                    </Button>
                  </>
                )}
              </div>
              {MENUS.map((menu) => (
                <a
                  key={menu.href}
                  href={menu.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {menu.name}
                </a>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
