import { useAnonymousUserContext } from '@/components/anonymous-user-context-provider';
import DeferredFloatingChatWidget from '@/components/chat/deferred-floating-chat-widget';
import type { ChatActor } from '@/components/chat/state';
import {
    ChatContextProvider,
    FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';
import type { TenantLayoutProps } from '.';
import { Footer } from './footer';
import { Header } from './header';

const TENANT_THEME_CLASSES = ['light', 'dark', 'greenie', 'calmie', 'warmie'];

export default function Inner({ children, onNavigateAway }: TenantLayoutProps) {
    const { auth, company, tenant } = usePageSharedDataProps();
    const { url } = usePage();
    const showFooter =
        !url.startsWith('/tours') &&
        !url.startsWith('/mybookings') &&
        !url.startsWith('/bookings');
    const anonymousUser = useAnonymousUserContext();
    const tenantCompany = tenant ?? company;
    const theme = useMemo(() => {
        try {
            const rawData = JSON.parse(
                tenantCompany?.settings?.landing_page_data || '{}',
            );

            return rawData?.root?.props?.theme ?? '';
        } catch {
            return '';
        }
    }, [tenantCompany]);

    useEffect(() => {
        const themeClasses = theme
            .split(/\s+/)
            .filter((className: string) =>
                TENANT_THEME_CLASSES.includes(className),
            );

        document.body.classList.remove(...TENANT_THEME_CLASSES);

        if (themeClasses.length > 0) {
            document.body.classList.add(...themeClasses);
        }

        return () => {
            document.body.classList.remove(...themeClasses);
        };
    }, [theme]);
    const actor = useMemo<ChatActor>(() => {
        if (auth?.user) {
            return { type: 'user', id: auth.user.id };
        }
        return { type: 'anonymous-user', id: anonymousUser.id || 0 };
    }, [auth, anonymousUser]);
    const defaultLiveChatRecipient = tenantCompany?.id
        ? {
              actor: {
                  type: 'company' as const,
                  id: tenantCompany.id,
              },
          }
        : null;

    return (
        <ChatContextProvider actor={actor}>
            <FloatingChatWidgetContextProvider>
                <div
                    className={`${theme} bg-background text-foreground transition-colors duration-300`}
                >
                    <div className="min-h-screen ">
                        <Header onNavigateAway={onNavigateAway} />
                        <main>{children}</main>
                    </div>
                    {showFooter && <Footer />}
                </div>
                <DeferredFloatingChatWidget
                    defaultLiveChatRecipient={defaultLiveChatRecipient}
                />
            </FloatingChatWidgetContextProvider>
        </ChatContextProvider>
    );
}
