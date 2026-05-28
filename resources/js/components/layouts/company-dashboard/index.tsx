import FloatingChatWidget from '@/components/chat/floating-chat-widget';
import {
    ChatContextProvider,
    FloatingChatWidgetContextProvider,
} from '@/components/chat/state';
import { Separator } from '@/components/ui/separator';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { Link } from '@inertiajs/react';
import { type ReactNode } from 'react';
import type { BreadcrumbItemInfo } from '../components/breadcrumb-renderer';
import BreadcrumbRenderer from '../components/breadcrumb-renderer';
import { SidebarSection } from './sidebar-section';

export type CompanyDashboardLayoutProps = {
    children: ReactNode;
    breadcrumb?: BreadcrumbItemInfo[];
    applet?: ReactNode;
    containerClassName?: string;
    activeMenuIds?: string[];
    openMenuIds?: string[];
};

export default function CompanyDashboardLayout(
    props: CompanyDashboardLayoutProps,
) {
    const { company, subscriptionRules } = usePageSharedDataProps() as any;
    const { children, breadcrumb, applet, containerClassName } = props;

    const isExpired = subscriptionRules?.isExpired;
    const walletBalance = company?.wallet?.balance || 0;

    return (
        <ChatContextProvider actor={{ type: 'company', id: company.id }}>
            <FloatingChatWidgetContextProvider>
                <SidebarProvider>
                    <SidebarSection {...props} />
                    <SidebarInset className="relative">
                        <header className="flex h-16 w-full shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                            <div className="flex w-full items-center gap-2 px-4">
                                <SidebarTrigger className="-ml-1" />
                                <Separator
                                    orientation="vertical"
                                    className="mr-2 data-[orientation=vertical]:h-4"
                                />
                                <div className="flex-1">
                                    <BreadcrumbRenderer
                                        breadcrumb={breadcrumb}
                                    />
                                </div>
                                <div>{applet}</div>
                            </div>
                        </header>

                        <div
                            className={`min-w-0 overflow-x-hidden ${containerClassName || ''} ${isExpired ? 'blur-md pointer-events-none select-none' : ''}`}
                        >
                            {children}
                        </div>

                        {isExpired && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                                <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full text-center flex flex-col items-center gap-5">
                                    <div className="bg-red-100 p-4 rounded-full">
                                        <svg
                                            className="w-10 h-10 text-red-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                            />
                                        </svg>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-2xl font-bold text-slate-800">
                                            Subscription Expired
                                        </h2>
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            Your agent subscription has ended.
                                            You no longer have access to
                                            marketing features and your landing
                                            page is currently disabled.
                                        </p>
                                    </div>

                                    <div className="w-full bg-slate-50 border border-slate-100 rounded-lg p-4 flex flex-col gap-1">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Current Wallet Balance
                                        </span>
                                        <span className="text-xl font-bold text-slate-800">
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(walletBalance)}
                                        </span>
                                    </div>

                                    <div className="w-full flex flex-col gap-3 mt-2">
                                        <Link
                                            href={`/companies/${company.username}/dashboard/agent-subscriptions`}
                                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-md font-semibold w-full transition-colors"
                                        >
                                            Renew Subscription Now
                                        </Link>
                                        <Link
                                            href={`/companies/${company.username}/dashboard/profile`}
                                            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                                        >
                                            Go to Profile settings
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </SidebarInset>
                    <FloatingChatWidget />
                </SidebarProvider>
            </FloatingChatWidgetContextProvider>
        </ChatContextProvider>
    );
}
