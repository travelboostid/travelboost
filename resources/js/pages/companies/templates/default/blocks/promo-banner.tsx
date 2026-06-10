import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { ClockIcon, FlameIcon, XIcon } from 'lucide-react';
import { useState } from 'react';

export type PromoBannerComponentProps = {
    enabled: boolean;
    headline: string;
    subline: string;
    countdownLabel: string;
    ctaLabel: string;
    ctaHref: string;
    style: 'gradient' | 'dark' | 'accent';
    dismissible: boolean;
};

const styleClasses = {
    gradient:
        'bg-linear-to-r from-primary via-primary/95 to-secondary text-primary-foreground',
    dark: 'bg-foreground text-background',
    accent: 'bg-secondary text-secondary-foreground',
};

function PromoBannerView({
    enabled,
    headline,
    subline,
    countdownLabel,
    ctaLabel,
    ctaHref,
    style,
    dismissible,
    editMode,
}: PromoBannerComponentProps & { editMode?: boolean }) {
    const [dismissed, setDismissed] = useState(false);

    if (!enabled || (dismissed && !editMode)) {
        return null;
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden px-4 py-3 md:px-6',
                styleClasses[style],
            )}
        >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
            <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 text-center md:justify-between md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
                    <FlameIcon className="size-5 shrink-0 animate-pulse" />
                    <div>
                        <p className="font-semibold">{headline}</p>
                        <p className="text-sm opacity-90">{subline}</p>
                    </div>
                    {countdownLabel && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                            <ClockIcon className="size-3.5" />
                            {countdownLabel}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {editMode ? (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0"
                        >
                            {ctaLabel}
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="secondary"
                            className="shrink-0"
                            asChild
                        >
                            <Link href={ctaHref}>{ctaLabel}</Link>
                        </Button>
                    )}
                    {dismissible && (
                        <button
                            type="button"
                            onClick={() => setDismissed(true)}
                            className="rounded-full p-1 opacity-70 transition hover:bg-white/10 hover:opacity-100"
                            aria-label="Dismiss"
                        >
                            <XIcon className="size-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export const PromoBannerComponentConfig: ComponentConfig<PromoBannerComponentProps> =
    {
        label: 'Promo Banner',
        fields: {
            enabled: {
                type: 'radio',
                label: 'Show Banner',
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                ],
            },
            headline: {
                type: 'text',
                label: 'Headline',
                contentEditable: true,
            },
            subline: { type: 'text', label: 'Subline', contentEditable: true },
            countdownLabel: {
                type: 'text',
                label: 'Urgency Text',
                contentEditable: true,
            },
            ctaLabel: {
                type: 'text',
                label: 'Button Label',
                contentEditable: true,
            },
            ctaHref: { type: 'text', label: 'Button URL' },
            style: {
                type: 'select',
                label: 'Style',
                options: [
                    { value: 'gradient', label: 'Gradient' },
                    { value: 'dark', label: 'Dark' },
                    { value: 'accent', label: 'Accent' },
                ],
            },
            dismissible: {
                type: 'radio',
                label: 'Dismissible',
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                ],
            },
        } as ComponentConfig<PromoBannerComponentProps>['fields'],
        defaultProps: {
            enabled: true,
            headline: 'Summer Sale — Up to 40% Off',
            subline: 'Book your dream vacation before prices rise',
            countdownLabel: 'Ends in 3 days',
            ctaLabel: 'Grab the Deal',
            ctaHref: '/deals',
            style: 'gradient',
            dismissible: true,
        },
        render: (props) => <PromoBannerView {...props} />,
    };
