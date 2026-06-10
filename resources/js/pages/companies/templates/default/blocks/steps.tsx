import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';

export type StepsComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    steps: { title: string; description: string }[];
};

export const StepsComponentConfig: ComponentConfig<StepsComponentProps> = {
    label: 'Process Steps',
    fields: {
        ...contentHeaderFields(),
        ...contentStyleFields,
        steps: {
            label: 'Steps',
            type: 'array',
            max: 6,
            arrayFields: {
                title: { label: 'Title', type: 'text', contentEditable: true },
                description: {
                    label: 'Description',
                    type: 'text',
                    contentEditable: true,
                },
            },
            getItemSummary: (item) => item.title || 'Step',
        },
    } as ComponentConfig<StepsComponentProps>['fields'],
    defaultProps: {
        badge: 'How It Works',
        header: 'Plan Your Trip in 4 Easy Steps',
        description: 'Everything you need for the perfect journey',
        ...contentStyleDefaults,
        steps: [
            {
                title: 'Choose Destination',
                description: 'Browse and select your dream location',
            },
            {
                title: 'Pick Dates',
                description: 'Select your preferred travel dates',
            },
            {
                title: 'Customize Package',
                description: 'Add activities and preferences',
            },
            {
                title: 'Book & Go',
                description: 'Complete booking and start exploring',
            },
        ],
    },
    render: ({
        badge,
        header,
        description,
        steps,
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
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {steps.map((step, i) => (
                    <div key={i} className="relative text-center">
                        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
                            {String(i + 1).padStart(2, '0')}
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-foreground">
                            {step.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                            {step.description}
                        </p>
                    </div>
                ))}
            </div>
        </ContentSection>
    ),
};
