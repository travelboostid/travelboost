import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    SectionHeader,
    columnGridClass,
    sectionContainerClass,
    sectionHeaderFields,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from '../../components/section-styles';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type StatsStyle = 'plain' | 'cards' | 'bordered';

export type StatsComponentProps = {
    badge: string;
    header: string;
    description: string;
    style: StatsStyle;
    columns: 2 | 3 | 4;
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    items: { value: string; label: string; icon: string }[];
};

export const StatsComponentConfig: ComponentConfig<StatsComponentProps> = {
    label: 'Stats',
    fields: {
        ...sectionHeaderFields(),
        ...sectionStyleFields,
        style: {
            type: 'select',
            label: 'Display Style',
            options: [
                { value: 'plain', label: 'Plain Numbers' },
                { value: 'cards', label: 'Cards' },
                { value: 'bordered', label: 'Bordered Columns' },
            ],
        },
        columns: {
            type: 'select',
            label: 'Columns',
            options: [
                { value: 2, label: '2 Columns' },
                { value: 3, label: '3 Columns' },
                { value: 4, label: '4 Columns' },
            ],
        },
        items: {
            type: 'array',
            label: 'Stats',
            max: 6,
            arrayFields: {
                value: { type: 'text', label: 'Value', contentEditable: true },
                label: { type: 'text', label: 'Label', contentEditable: true },
                icon: {
                    type: 'select',
                    label: 'Icon (optional)',
                    options: [
                        { value: '', label: 'None' },
                        ...LUCIDE_ICON_NAMES.slice(0, 80).map((name) => ({
                            label: name,
                            value: name,
                        })),
                    ],
                },
            },
            getItemSummary: (item) => item.value || 'Stat',
        },
    },
    defaultProps: {
        badge: 'Our Impact',
        header: 'By the Numbers',
        description: 'Trusted by travelers around the world',
        ...sectionStyleDefaults,
        background: 'muted',
        style: 'cards',
        columns: 4,
        items: [
            { value: '500+', label: 'Destinations', icon: 'MapPin' },
            { value: '50k+', label: 'Happy Travelers', icon: 'Users' },
            { value: '15+', label: 'Years Experience', icon: 'Award' },
            { value: '24/7', label: 'Support', icon: 'Headphones' },
        ],
    },
    render: ({
        badge,
        header,
        description,
        style,
        columns,
        padding,
        align,
        background,
        maxWidth,
        items,
    }) => (
        <section className={sectionContainerClass({ padding, background })}>
            <div className={sectionInnerClass(maxWidth)}>
                <SectionHeader
                    badge={badge}
                    header={header}
                    description={description}
                    align={align}
                    inverted={background === 'primary'}
                />
                <div className={columnGridClass(columns)}>
                    {items.map((item, i) => {
                        const content = (
                            <>
                                {item.icon && (
                                    <LucideIconRenderer
                                        name={item.icon}
                                        className="mb-3 size-8 text-primary"
                                    />
                                )}
                                <p className="text-3xl font-bold tracking-tight text-primary md:text-4xl lg:text-5xl">
                                    {item.value}
                                </p>
                                <p className="mt-2 text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    {item.label}
                                </p>
                            </>
                        );

                        if (style === 'cards') {
                            return (
                                <Card
                                    key={i}
                                    className="border-border/60 bg-card/80 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                >
                                    {content}
                                </Card>
                            );
                        }

                        if (style === 'bordered') {
                            return (
                                <div
                                    key={i}
                                    className={cn(
                                        'px-6 py-4 text-center',
                                        i > 0 && 'border-border sm:border-l',
                                    )}
                                >
                                    {content}
                                </div>
                            );
                        }

                        return (
                            <div key={i} className="text-center">
                                {content}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    ),
};
