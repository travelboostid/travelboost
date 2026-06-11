import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Fields } from '@puckeditor/core';
import type { ReactNode } from 'react';

export type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type SectionAlign = 'left' | 'center' | 'right';
export type SectionBackground =
    | 'none'
    | 'default'
    | 'muted'
    | 'card'
    | 'primary'
    | 'gradient';
export type SectionMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type SectionStyleProps = {
    padding?: SectionPadding;
    align?: SectionAlign;
    background?: SectionBackground;
    maxWidth?: SectionMaxWidth;
};

export type SectionHeaderProps = {
    badge?: string;
    header?: string;
    description?: string;
    align?: SectionAlign;
    className?: string;
};

export const sectionPaddingClasses: Record<SectionPadding, string> = {
    none: 'py-0',
    sm: 'py-8 sm:py-12',
    md: 'py-12 sm:py-16',
    lg: 'py-16 sm:py-20 lg:py-24',
    xl: 'py-20 sm:py-28 lg:py-32',
};

export const sectionBackgroundClasses: Record<SectionBackground, string> = {
    none: '',
    default: 'bg-background',
    muted: 'bg-muted/50',
    card: 'bg-card',
    primary: 'bg-primary text-primary-foreground',
    gradient: 'bg-linear-to-br from-primary/5 via-background to-secondary/10',
};

export const sectionMaxWidthClasses: Record<SectionMaxWidth, string> = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    xl: 'max-w-[90rem]',
    full: 'max-w-full',
};

export const sectionAlignClasses: Record<SectionAlign, string> = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
};

export function columnGridClass(columns: 2 | 3 | 4): string {
    const map: Record<2 | 3 | 4, string> = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    };

    return cn('grid gap-6', map[columns]);
}

export function sectionContainerClass({
    padding = 'lg',
    background = 'none',
    className,
}: SectionStyleProps & { className?: string }): string {
    return cn(
        sectionPaddingClasses[padding],
        sectionBackgroundClasses[background],
        'px-4 sm:px-6 lg:px-8',
        className,
    );
}

export function sectionInnerClass(maxWidth: SectionMaxWidth = 'lg'): string {
    return cn('mx-auto w-full', sectionMaxWidthClasses[maxWidth]);
}

export function SectionHeader({
    badge,
    header,
    description,
    align = 'center',
    className,
    inverted = false,
}: SectionHeaderProps & { inverted?: boolean }) {
    if (!badge && !header && !description) {
        return null;
    }

    return (
        <div
            className={cn(
                'mb-12 flex flex-col gap-4 sm:mb-16',
                sectionAlignClasses[align],
                className,
            )}
        >
            {badge && (
                <Badge
                    variant="outline"
                    className={cn(
                        'w-fit text-xs font-medium tracking-wide uppercase',
                        align === 'center' && 'mx-auto',
                        align === 'right' && 'ml-auto',
                        inverted &&
                            'border-primary-foreground/30 text-primary-foreground',
                    )}
                >
                    {badge}
                </Badge>
            )}
            {header && (
                <h2
                    className={cn(
                        'text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl',
                        inverted
                            ? 'text-primary-foreground'
                            : 'text-foreground',
                    )}
                >
                    {header}
                </h2>
            )}
            {description && (
                <p
                    className={cn(
                        'max-w-2xl text-lg leading-relaxed',
                        align === 'center' && 'mx-auto',
                        align === 'right' && 'ml-auto',
                        inverted
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground',
                    )}
                >
                    {description}
                </p>
            )}
        </div>
    );
}

export const sectionStyleFields = {
    padding: {
        type: 'select' as const,
        label: 'Section Padding',
        options: [
            { value: 'none', label: 'None' },
            { value: 'sm', label: 'Small' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Large' },
            { value: 'xl', label: 'Extra Large' },
        ],
    },
    align: {
        type: 'select' as const,
        label: 'Text Alignment',
        options: [
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
        ],
    },
    background: {
        type: 'select' as const,
        label: 'Background',
        options: [
            { value: 'none', label: 'Transparent' },
            { value: 'default', label: 'Default' },
            { value: 'muted', label: 'Muted' },
            { value: 'card', label: 'Card' },
            { value: 'primary', label: 'Primary' },
            { value: 'gradient', label: 'Gradient' },
        ],
    },
    maxWidth: {
        type: 'select' as const,
        label: 'Content Width',
        options: [
            { value: 'sm', label: 'Narrow' },
            { value: 'md', label: 'Medium' },
            { value: 'lg', label: 'Wide' },
            { value: 'xl', label: 'Extra Wide' },
            { value: 'full', label: 'Full Width' },
        ],
    },
};

export const sectionStyleDefaults: Required<SectionStyleProps> = {
    padding: 'lg',
    align: 'center',
    background: 'none',
    maxWidth: 'lg',
};

export function sectionHeaderFields(): Fields<{
    badge: string;
    header: string;
    description: string;
}> {
    return {
        badge: {
            label: 'Badge / Eyebrow',
            type: 'text',
            contentEditable: true,
        },
        header: { label: 'Header', type: 'text', contentEditable: true },
        description: {
            label: 'Description',
            type: 'textarea',
            contentEditable: true,
        },
    };
}

export function SectionShell({
    padding,
    background,
    maxWidth = 'lg',
    className,
    children,
}: SectionStyleProps & { className?: string; children: ReactNode }) {
    return (
        <section
            className={sectionContainerClass({
                padding,
                background,
                className,
            })}
        >
            <div className={sectionInnerClass(maxWidth)}>{children}</div>
        </section>
    );
}
