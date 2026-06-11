import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type TimelineComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    items: { date: string; title: string; description: string }[];
};

export const TimelineComponentConfig: ComponentConfig<TimelineComponentProps> =
    {
        label: 'Timeline',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            items: {
                type: 'array',
                label: 'Timeline Items',
                max: 8,
                arrayFields: {
                    date: {
                        type: 'text',
                        label: 'Date / Year',
                        contentEditable: true,
                    },
                    title: {
                        type: 'text',
                        label: 'Title',
                        contentEditable: true,
                    },
                    description: {
                        type: 'textarea',
                        label: 'Description',
                        contentEditable: true,
                    },
                },
                getItemSummary: (item) => item.title || 'Event',
            },
        } as ComponentConfig<TimelineComponentProps>['fields'],
        defaultProps: {
            badge: 'Our Journey',
            header: 'Milestones That Shaped Us',
            description:
                'From a small local agency to a global travel community',
            ...contentStyleDefaults,
            background: 'default',
            items: [
                {
                    date: '2010',
                    title: 'Founded in Jakarta',
                    description:
                        'Started with a passion for connecting travelers to hidden gems in Southeast Asia.',
                },
                {
                    date: '2015',
                    title: 'Expanded to 50+ Destinations',
                    description:
                        'Grew our network of local partners across Asia, Europe, and the Americas.',
                },
                {
                    date: '2020',
                    title: '50,000 Happy Travelers',
                    description:
                        'Reached a major milestone serving travelers from over 30 countries worldwide.',
                },
                {
                    date: '2024',
                    title: 'Award-Winning Service',
                    description:
                        'Recognized as a top travel agency for customer satisfaction and sustainable tourism.',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            items,
            padding,
            align,
            background,
            maxWidth,
        }) => (
            <ContentSection
                badge={badge}
                header={header}
                description={description}
                align={align}
                padding={padding}
                background={background}
                maxWidth={maxWidth}
            >
                <div className="relative mx-auto max-w-3xl">
                    <div className="absolute top-0 left-4 h-full w-px bg-border md:left-1/2 md:-translate-x-px" />
                    <div className="space-y-10">
                        {items.map((item, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'relative pl-12 md:pl-0',
                                    i % 2 === 0
                                        ? 'md:pr-[calc(50%+2rem)] md:text-right'
                                        : 'md:pl-[calc(50%+2rem)]',
                                )}
                            >
                                <div
                                    className={cn(
                                        'absolute top-1 left-0 flex size-8 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary md:left-1/2 md:-translate-x-1/2',
                                    )}
                                >
                                    {String(i + 1).padStart(2, '0')}
                                </div>
                                <span className="text-sm font-semibold text-primary">
                                    {item.date}
                                </span>
                                <h3 className="mt-1 text-lg font-semibold text-foreground">
                                    {item.title}
                                </h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </ContentSection>
        ),
    };
