import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { SearchIcon } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { imageField } from '../../components/fields';
import {
    HeroActions,
    HeroBadge,
    HeroDescription,
    HeroHeadline,
    heroContentFields,
    heroInnerClass,
    heroShellClass,
    heroStyleDefaults,
    heroStyleFields,
    type HeroStyleProps,
} from '../../components/hero-shared';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type Hero6ComponentProps = HeroStyleProps & {
    badge: string;
    header: string;
    description: string;
    backgroundUrl: string;
    searchPlaceholder: string;
    searchButtonLabel: string;
    searchHref: string;
    showSearchBar: boolean;
    actions: LinkButtonComponentProps[];
    destinations: { label: string; icon: string }[];
};

export const Hero6ComponentConfig: ComponentConfig<Hero6ComponentProps> = {
    label: 'Booking Focus',
    fields: {
        ...heroContentFields,
        ...heroStyleFields,
        backgroundUrl: imageField('Background Image'),
        showSearchBar: {
            type: 'radio',
            label: 'Show Search Bar',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
        searchPlaceholder: {
            type: 'text',
            label: 'Search Placeholder',
        },
        searchButtonLabel: {
            type: 'text',
            label: 'Search Button Label',
            contentEditable: true,
        },
        searchHref: { type: 'text', label: 'Search Link URL' },
        destinations: {
            type: 'array',
            label: 'Popular Destinations',
            max: 6,
            arrayFields: {
                label: { type: 'text', label: 'Label', contentEditable: true },
                icon: {
                    type: 'select',
                    label: 'Icon',
                    options: LUCIDE_ICON_NAMES.slice(0, 60).map((name) => ({
                        label: name,
                        value: name,
                    })),
                },
            },
            getItemSummary: (item) => item.label || 'Destination',
        },
    } as ComponentConfig<Hero6ComponentProps>['fields'],
    defaultProps: {
        badge: 'Plan Your Trip',
        header: 'Where Will You Go Next?',
        description:
            'Search destinations, compare packages, and book your dream vacation in minutes.',
        ...heroStyleDefaults,
        background: 'primary',
        align: 'center',
        minHeight: 'medium',
        overlay: 'none',
        backgroundUrl: '',
        showSearchBar: true,
        searchPlaceholder: 'Search destinations, tours, packages...',
        searchButtonLabel: 'Search',
        searchHref: '/tours',
        actions: [
            {
                variant: 'secondary',
                label: 'View All Tours',
                size: 'lg',
                disabled: false,
                className: '',
                type: 'button',
                href: '/tours',
                target: '_self',
            },
        ],
        destinations: [
            { label: 'Bali', icon: 'Palmtree' },
            { label: 'Tokyo', icon: 'Building2' },
            { label: 'Paris', icon: 'Landmark' },
            { label: 'Swiss Alps', icon: 'Mountain' },
        ],
    },
    render: ({
        badge,
        header,
        description,
        backgroundUrl,
        showSearchBar,
        searchPlaceholder,
        searchButtonLabel,
        searchHref,
        actions,
        destinations,
        align,
        padding,
        background,
        maxWidth,
        minHeight,
        overlay,
        editMode,
    }) => {
        const style: HeroStyleProps = {
            padding,
            align,
            background,
            maxWidth,
            minHeight,
            overlay,
        };
        const inverted = style.background === 'primary';

        return (
            <section
                className={cn(
                    heroShellClass(style),
                    'relative overflow-hidden',
                )}
            >
                {backgroundUrl && (
                    <>
                        <img
                            src={backgroundUrl}
                            alt=""
                            className="absolute inset-0 size-full object-cover opacity-20"
                        />
                        <div className="absolute inset-0 bg-linear-to-b from-primary/80 to-primary" />
                    </>
                )}
                <div
                    className={cn(
                        heroInnerClass(style.maxWidth),
                        'relative z-10',
                    )}
                >
                    <div
                        className={cn(
                            'mx-auto max-w-4xl',
                            align === 'center' && 'text-center',
                        )}
                    >
                        <HeroBadge
                            badge={badge}
                            align={align}
                            inverted={inverted}
                        />
                        <HeroHeadline
                            header={header}
                            align={align}
                            inverted={inverted}
                            size="lg"
                        />
                        <HeroDescription
                            description={description}
                            align={align}
                            inverted={inverted}
                        />

                        {showSearchBar && (
                            <div className="mx-auto mt-10 max-w-2xl">
                                <div className="flex flex-col gap-3 rounded-2xl border border-white/20 bg-background/95 p-2 shadow-2xl backdrop-blur sm:flex-row sm:items-center">
                                    <div className="flex flex-1 items-center gap-3 px-4 py-2">
                                        <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
                                        <span className="text-muted-foreground">
                                            {searchPlaceholder}
                                        </span>
                                    </div>
                                    {editMode ? (
                                        <span className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground">
                                            {searchButtonLabel}
                                        </span>
                                    ) : (
                                        <a
                                            href={searchHref}
                                            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                                        >
                                            {searchButtonLabel}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {destinations.length > 0 && (
                            <div className="mt-8 flex flex-wrap justify-center gap-2">
                                <span
                                    className={cn(
                                        'mr-2 self-center text-sm',
                                        inverted
                                            ? 'text-primary-foreground/70'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    Popular:
                                </span>
                                {destinations.map((dest, i) => (
                                    <Badge
                                        key={i}
                                        variant="secondary"
                                        className="gap-1.5 px-3 py-1.5 text-sm font-normal"
                                    >
                                        <LucideIconRenderer
                                            name={dest.icon}
                                            className="size-3.5"
                                        />
                                        {dest.label}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <HeroActions
                            actions={actions}
                            align={align}
                            editMode={editMode}
                        />
                    </div>
                </div>
            </section>
        );
    },
};
