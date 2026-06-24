import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { LinkButtonComponentProps } from '../base/blocks/link-button';
import { linkButtonActionsField } from './fields';
import { PuckImage } from './puck-image';
import {
    sectionAlignClasses,
    sectionContainerClass,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from './section-styles';

export type HeroMinHeight = 'auto' | 'medium' | 'tall' | 'screen';
export type HeroOverlay = 'none' | 'light' | 'dark' | 'gradient';

export type HeroStyleProps = {
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    minHeight: HeroMinHeight;
    overlay: HeroOverlay;
};

export const heroMinHeightClasses: Record<HeroMinHeight, string> = {
    auto: '',
    medium: 'min-h-[60vh]',
    tall: 'min-h-[80vh]',
    screen: 'min-h-screen',
};

export const heroOverlayClasses: Record<HeroOverlay, string> = {
    none: '',
    light: 'bg-background/60',
    dark: 'bg-black/50',
    gradient:
        'bg-linear-to-t from-background via-background/70 to-background/30',
};

export const heroStyleDefaults: HeroStyleProps = {
    ...sectionStyleDefaults,
    padding: 'xl',
    minHeight: 'tall',
    overlay: 'none',
};

export const heroStyleFields = {
    ...sectionStyleFields,
    minHeight: {
        type: 'select' as const,
        label: 'Minimum Height',
        options: [
            { value: 'auto', label: 'Auto' },
            { value: 'medium', label: 'Medium (60vh)' },
            { value: 'tall', label: 'Tall (80vh)' },
            { value: 'screen', label: 'Full Screen' },
        ],
    },
    overlay: {
        type: 'select' as const,
        label: 'Background Overlay',
        options: [
            { value: 'none', label: 'None' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'gradient', label: 'Gradient Fade' },
        ],
    },
};

export const heroContentFields = {
    badge: {
        label: 'Badge / Eyebrow',
        type: 'text' as const,
        contentEditable: true,
    },
    header: {
        label: 'Headline',
        type: 'richtext' as const,
        contentEditable: true,
    },
    description: {
        label: 'Description',
        type: 'textarea' as const,
        contentEditable: true,
    },
    actions: linkButtonActionsField('Buttons', 3),
};

export const defaultHeroActions: LinkButtonComponentProps[] = [
    {
        variant: 'default',
        label: 'Browse Destinations',
        size: 'lg',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
    },
    {
        variant: 'outline',
        label: 'Learn More',
        size: 'lg',
        disabled: false,
        className: '',
        type: 'button',
        href: '/tours',
        target: '_self',
    },
];

export const defaultHeroSummaries = [
    { title: '500+', subtitle: 'Destinations' },
    { title: '50k+', subtitle: 'Happy Travelers' },
    { title: '24/7', subtitle: 'Support' },
];

export function HeroBadge({
    badge,
    align,
    inverted,
}: {
    badge?: string;
    align: SectionAlign;
    inverted?: boolean;
}) {
    if (!badge) {
        return null;
    }

    return (
        <Badge
            variant="outline"
            className={cn(
                'mb-4 w-fit text-xs font-medium tracking-wide uppercase',
                align === 'center' && 'mx-auto',
                align === 'right' && 'ml-auto',
                inverted &&
                    'border-primary-foreground/30 text-primary-foreground',
            )}
        >
            {badge}
        </Badge>
    );
}

export function HeroHeadline({
    header,
    align,
    inverted,
    size = 'lg',
}: {
    header: string;
    align: SectionAlign;
    inverted?: boolean;
    size?: 'md' | 'lg' | 'xl';
}) {
    const sizeClasses = {
        md: 'text-4xl md:text-5xl',
        lg: 'text-5xl md:text-6xl lg:text-7xl',
        xl: 'text-6xl md:text-7xl lg:text-8xl',
    };

    return (
        <h1
            className={cn(
                'font-bold tracking-tight text-balance',
                sizeClasses[size],
                sectionAlignClasses[align],
                inverted ? 'text-primary-foreground' : 'text-foreground',
            )}
        >
            {header}
        </h1>
    );
}

export function HeroDescription({
    description,
    align,
    inverted,
}: {
    description: string;
    align: SectionAlign;
    inverted?: boolean;
}) {
    return (
        <p
            className={cn(
                'mt-6 max-w-2xl text-lg leading-relaxed text-balance md:text-xl',
                align === 'center' && 'mx-auto',
                align === 'right' && 'ml-auto',
                inverted
                    ? 'text-primary-foreground/85'
                    : 'text-muted-foreground',
            )}
        >
            {description}
        </p>
    );
}

export function HeroActions({
    actions,
    align,
    editMode,
}: {
    actions: LinkButtonComponentProps[];
    align: SectionAlign;
    editMode?: boolean;
}) {
    return (
        <div
            className={cn(
                'mt-8 flex flex-wrap gap-3',
                align === 'center' && 'justify-center',
                align === 'right' && 'justify-end',
            )}
        >
            {actions.map(({ label, target, href, ...buttonProps }, i) =>
                editMode ? (
                    <Button key={i} {...buttonProps}>
                        {label}
                    </Button>
                ) : (
                    <Button key={i} {...buttonProps} asChild>
                        <Link href={href} target={target}>
                            {label}
                        </Link>
                    </Button>
                ),
            )}
        </div>
    );
}

export function HeroStats({
    summaries,
    align = 'center',
    inverted,
}: {
    summaries: { title: string; subtitle?: string }[];
    align?: SectionAlign;
    inverted?: boolean;
}) {
    if (!summaries.length) {
        return null;
    }

    return (
        <div
            className={cn(
                'mt-12 grid gap-6 border-t border-border/50 pt-10',
                summaries.length === 2 && 'grid-cols-2',
                summaries.length >= 3 && 'grid-cols-3',
                align === 'center' && 'mx-auto max-w-3xl',
            )}
        >
            {summaries.map((summary, i) => (
                <div key={i} className="text-center">
                    <p
                        className={cn(
                            'text-3xl font-bold md:text-4xl',
                            inverted
                                ? 'text-primary-foreground'
                                : 'text-primary',
                        )}
                    >
                        {summary.title}
                    </p>
                    {summary.subtitle && (
                        <p
                            className={cn(
                                'mt-1 text-sm',
                                inverted
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {summary.subtitle}
                        </p>
                    )}
                </div>
            ))}
        </div>
    );
}

export function HeroImage({
    src,
    alt,
    className,
    rounded = '2xl',
}: {
    src?: string;
    alt?: string;
    className?: string;
    rounded?: 'xl' | '2xl' | '3xl';
}) {
    const roundedClass = {
        xl: 'rounded-xl',
        '2xl': 'rounded-2xl',
        '3xl': 'rounded-3xl',
    }[rounded];

    if (!src) {
        return (
            <div
                className={cn(
                    'flex aspect-[4/5] w-full items-center justify-center bg-linear-to-br from-primary/10 to-secondary/10',
                    roundedClass,
                    className,
                )}
            >
                <span className="text-sm text-muted-foreground">
                    Add hero image
                </span>
            </div>
        );
    }

    return (
        <PuckImage
            src={src}
            alt={alt || 'Hero'}
            priority
            className={cn(
                'w-full object-cover shadow-2xl',
                roundedClass,
                className,
            )}
        />
    );
}

export function HeroBackground({
    imageUrl,
    overlay,
    children,
    className,
}: {
    imageUrl?: string;
    overlay: HeroOverlay;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('relative overflow-hidden', className)}>
            {imageUrl && (
                <PuckImage
                    src={imageUrl}
                    alt=""
                    priority
                    className="absolute inset-0 size-full object-cover"
                />
            )}
            {overlay !== 'none' && (
                <div
                    className={cn(
                        'absolute inset-0',
                        heroOverlayClasses[overlay],
                    )}
                />
            )}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

export function heroShellClass(style: HeroStyleProps): string {
    return cn(
        sectionContainerClass({
            padding: style.padding,
            background: style.background,
        }),
        heroMinHeightClasses[style.minHeight],
        'flex items-center',
    );
}

export function heroInnerClass(maxWidth: SectionMaxWidth): string {
    return sectionInnerClass(maxWidth);
}
