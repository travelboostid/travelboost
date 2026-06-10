import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import {
    FooterLinkList,
    defaultFooterColumns,
    footerColumnField,
    type FooterColumn,
} from '../../components/footer-shared';

export type Footer3ComponentProps = {
    brandName: string;
    newsletterTitle: string;
    newsletterDescription: string;
    subscribeLabel: string;
    subscribeHref: string;
    copyright: string;
    columns: FooterColumn[];
};

export const Footer3ComponentConfig: ComponentConfig<Footer3ComponentProps> = {
    label: 'Newsletter',
    fields: {
        brandName: {
            type: 'text',
            label: 'Brand Name',
            contentEditable: true,
        },
        newsletterTitle: {
            type: 'text',
            label: 'Newsletter Title',
            contentEditable: true,
        },
        newsletterDescription: {
            type: 'text',
            label: 'Newsletter Description',
            contentEditable: true,
        },
        subscribeLabel: {
            type: 'text',
            label: 'Subscribe Button',
            contentEditable: true,
        },
        subscribeHref: { type: 'text', label: 'Subscribe URL' },
        copyright: {
            type: 'text',
            label: 'Copyright',
            contentEditable: true,
        },
        columns: footerColumnField,
    },
    defaultProps: {
        brandName: 'TravelBoost',
        newsletterTitle: 'Get Travel Deals in Your Inbox',
        newsletterDescription:
            'Subscribe for exclusive offers, destination guides, and early access to new packages.',
        subscribeLabel: 'Subscribe',
        subscribeHref: '/tours',
        copyright: '© 2025 TravelBoost. All rights reserved.',
        columns: defaultFooterColumns.slice(0, 2),
    },
    render: ({
        brandName,
        newsletterTitle,
        newsletterDescription,
        subscribeLabel,
        subscribeHref,
        copyright,
        columns,
        editMode,
    }) => (
        <footer className="border-t border-border bg-card px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent p-8 md:p-10">
                    <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                        <div>
                            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
                                {brandName}
                            </p>
                            <h3 className="mt-2 text-2xl font-bold text-foreground md:text-3xl">
                                {newsletterTitle}
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                {newsletterDescription}
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="flex h-12 flex-1 items-center rounded-xl border border-border bg-background px-4 text-sm text-muted-foreground">
                                your@email.com
                            </div>
                            {editMode ? (
                                <Button size="lg" className="shrink-0">
                                    {subscribeLabel}
                                </Button>
                            ) : (
                                <Button size="lg" className="shrink-0" asChild>
                                    <Link href={subscribeHref}>
                                        {subscribeLabel}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <FooterLinkList
                        columns={columns}
                        editMode={editMode}
                        className="lg:grid-cols-2"
                    />
                </div>

                <p className="mt-10 text-center text-sm text-muted-foreground">
                    {copyright}
                </p>
            </div>
        </footer>
    ),
};
