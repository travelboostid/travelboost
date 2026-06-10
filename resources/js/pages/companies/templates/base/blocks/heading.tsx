import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';

export type HeadingComponentProps = {
    text: string;
    subtitle: string;
    badge: string;
    level: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    align: 'left' | 'center' | 'right';
    style: 'default' | 'gradient' | 'underline';
};

const levelClasses: Record<HeadingComponentProps['level'], string> = {
    h1: 'text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl',
    h2: 'text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl',
    h3: 'text-2xl font-semibold tracking-tight md:text-3xl',
    h4: 'text-xl font-semibold md:text-2xl',
    h5: 'text-lg font-semibold',
    h6: 'text-base font-semibold uppercase tracking-wide',
};

const alignClasses: Record<HeadingComponentProps['align'], string> = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
};

export const HeadingComponentConfig: ComponentConfig<HeadingComponentProps> = {
    label: 'Heading',
    fields: {
        badge: {
            type: 'text',
            label: 'Badge / Eyebrow',
            contentEditable: true,
        },
        text: { type: 'text', label: 'Heading', contentEditable: true },
        subtitle: {
            type: 'textarea',
            label: 'Subtitle',
            contentEditable: true,
        },
        level: {
            type: 'select',
            label: 'Level',
            options: [
                { value: 'h1', label: 'H1 — Page Title' },
                { value: 'h2', label: 'H2 — Section' },
                { value: 'h3', label: 'H3 — Subsection' },
                { value: 'h4', label: 'H4' },
                { value: 'h5', label: 'H5' },
                { value: 'h6', label: 'H6 — Label' },
            ],
        },
        style: {
            type: 'select',
            label: 'Style',
            options: [
                { value: 'default', label: 'Default' },
                { value: 'gradient', label: 'Gradient Text' },
                { value: 'underline', label: 'With Accent Line' },
            ],
        },
        align: {
            type: 'select',
            label: 'Alignment',
            options: [
                { value: 'left', label: 'Left' },
                { value: 'center', label: 'Center' },
                { value: 'right', label: 'Right' },
            ],
        },
    },
    defaultProps: {
        badge: '',
        text: 'Section Heading',
        subtitle: '',
        level: 'h2',
        style: 'default',
        align: 'left',
    },
    render: ({ text, subtitle, badge, level, align, style }) => {
        const Tag = level;

        return (
            <div className={cn('flex flex-col gap-3', alignClasses[align])}>
                {badge && (
                    <Badge
                        variant="outline"
                        className={cn(
                            'w-fit text-xs font-medium uppercase tracking-wide',
                            align === 'center' && 'mx-auto',
                            align === 'right' && 'ml-auto',
                        )}
                    >
                        {badge}
                    </Badge>
                )}
                <Tag
                    className={cn(
                        levelClasses[level],
                        style === 'gradient'
                            ? 'bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent'
                            : 'text-foreground',
                        style === 'underline' && 'relative pb-4',
                    )}
                >
                    {text}
                    {style === 'underline' && (
                        <span
                            className={cn(
                                'absolute bottom-0 h-1 w-16 rounded-full bg-primary',
                                align === 'center' &&
                                    'left-1/2 -translate-x-1/2',
                                align === 'right' && 'right-0',
                                align === 'left' && 'left-0',
                            )}
                        />
                    )}
                </Tag>
                {subtitle && (
                    <p
                        className={cn(
                            'max-w-2xl text-lg leading-relaxed text-muted-foreground',
                            align === 'center' && 'mx-auto',
                            align === 'right' && 'ml-auto',
                        )}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
        );
    },
};
