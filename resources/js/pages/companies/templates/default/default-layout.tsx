import AnonymousUserContextProvider, {
    useAnonymousUserContext,
} from '@/components/anonymous-user-context-provider';
import AppLogoIcon from '@/components/app-logo-icon';
import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import type { ChatActor } from '@/components/chat/state';
import {
    ChatContextProvider,
    FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { show as showLogin } from '@/routes/customers/login';
import { show as showRegister } from '@/routes/customers/register';
import { Link } from '@inertiajs/react';
import type { WithId, WithPuckProps } from '@puckeditor/core';
import { MenuIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import { PuckImage } from '../components/puck-image';
import { DefaultLayoutNavUser } from './default-layout-nav-user';

type DefaultLayoutProps = WithId<
    WithPuckProps<{
        [x: string]: any;
    }>
>;

export default function DefaultLayout(props: DefaultLayoutProps) {
    return (
        <AnonymousUserContextProvider>
            <DefaultLayoutContent {...props} />
        </AnonymousUserContextProvider>
    );
}

function DefaultLayoutContent({
    children,
    title,
    theme,
    editMode,
}: DefaultLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { auth, company } = usePageSharedDataProps();
    const anonymousUser = useAnonymousUserContext();
    const actor: ChatActor = auth?.user
        ? { type: 'user', id: auth.user.id }
        : { type: 'anonymous-user', id: anonymousUser.id || 0 };

    return (
        <ChatContextProvider actor={actor}>
            <FloatingChatWidgetContextProvider>
                <div
                    className={`${theme} min-h-screen bg-background text-foreground transition-colors duration-300`}
                >
                    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex h-16 items-center justify-between">
                                <Link
                                    href="/"
                                    className="flex items-center gap-2"
                                >
                                    {company?.photo_url ? (
                                        <PuckImage
                                            src={company.photo_url}
                                            alt={title}
                                            className="h-9 w-9 rounded-full object-cover"
                                        />
                                    ) : (
                                        <AppLogoIcon className="h-9 w-9 text-primary-foreground" />
                                    )}
                                    <span className="text-xl font-bold text-foreground">
                                        {title}
                                    </span>
                                </Link>

                                <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
                                    <Link
                                        href="/"
                                        className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Home
                                    </Link>
                                    <Link
                                        href="/tours"
                                        className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        Tours
                                    </Link>
                                    <Link
                                        href="/mybookings"
                                        className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        My Bookings
                                    </Link>
                                    <Link
                                        href="/#about-us"
                                        className="font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        About Us
                                    </Link>
                                </nav>

                                <div className="hidden items-center justify-end gap-4 md:flex">
                                    {editMode ? (
                                        <>
                                            <Button asChild variant="ghost">
                                                <Link href="#">Masuk</Link>
                                            </Button>
                                            <Button asChild>
                                                <Link href="#">Daftar</Link>
                                            </Button>
                                        </>
                                    ) : auth?.user ? (
                                        <DefaultLayoutNavUser />
                                    ) : (
                                        <>
                                            <Button asChild variant="ghost">
                                                <Link href={showLogin()}>
                                                    Masuk
                                                </Link>
                                            </Button>
                                            <Button asChild>
                                                <Link href={showRegister()}>
                                                    Daftar
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 md:hidden">
                                    <button
                                        type="button"
                                        className="p-2 text-foreground"
                                        onClick={() =>
                                            setIsMenuOpen(!isMenuOpen)
                                        }
                                    >
                                        {isMenuOpen ? (
                                            <XIcon className="h-6 w-6" />
                                        ) : (
                                            <MenuIcon className="h-6 w-6" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {isMenuOpen && (
                                <div className="animate-in slide-in-from-top-2 border-t border-border py-4 md:hidden">
                                    <nav className="flex flex-col gap-4">
                                        <Link
                                            href="/"
                                            className="font-bold text-muted-foreground transition-colors hover:text-foreground"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Home
                                        </Link>
                                        <Link
                                            href="/tours"
                                            className="font-bold text-muted-foreground transition-colors hover:text-foreground"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Tours
                                        </Link>
                                        <Link
                                            href="/mybookings"
                                            className="font-bold text-muted-foreground transition-colors hover:text-foreground"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            My Bookings
                                        </Link>
                                        <Link
                                            href="/#about-us"
                                            className="font-bold text-muted-foreground transition-colors hover:text-foreground"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            About Us
                                        </Link>

                                        <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4">
                                            {editMode ? (
                                                <>
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                    >
                                                        <Link href="#">
                                                            Masuk
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        className="w-full justify-start"
                                                    >
                                                        <Link href="#">
                                                            Daftar
                                                        </Link>
                                                    </Button>
                                                </>
                                            ) : auth?.user ? (
                                                <DefaultLayoutNavUser />
                                            ) : (
                                                <>
                                                    <Button
                                                        asChild
                                                        variant="ghost"
                                                        className="w-full justify-start"
                                                    >
                                                        <Link
                                                            href={showLogin()}
                                                        >
                                                            Masuk
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        asChild
                                                        className="w-full justify-start"
                                                    >
                                                        <Link
                                                            href={showRegister()}
                                                        >
                                                            Daftar
                                                        </Link>
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
                {!editMode && (
                    <FloatingChatWidget
                        defaultLiveChatRecipient={
                            company?.id
                                ? {
                                      actor: {
                                          type: 'company',
                                          id: company.id,
                                      },
                                  }
                                : null
                        }
                    />
                )}
            </FloatingChatWidgetContextProvider>
        </ChatContextProvider>
    );
}
