import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { useState } from 'react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type ShowcaseTab = {
    label: string;
    title: string;
    description: string;
    image: string;
};

export type ShowcaseTabsComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    tabs: ShowcaseTab[];
};

function ShowcaseTabsView({
    badge,
    header,
    description,
    tabs,
    padding,
    align,
    background,
    maxWidth,
}: ShowcaseTabsComponentProps) {
    const [active, setActive] = useState(0);
    const current = tabs[active] ?? tabs[0];

    return (
        <ContentSection
            badge={badge}
            header={header}
            description={description}
            align={align}
            padding={padding}
            background={background}
            maxWidth={maxWidth}
        >
            <div className="flex flex-wrap justify-center gap-2">
                {tabs.map((tab, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => setActive(i)}
                        className={cn(
                            'rounded-full px-5 py-2.5 text-sm font-medium transition-all',
                            active === i
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80',
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="mt-10 grid items-center gap-8 overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-6 shadow-xl backdrop-blur-sm md:grid-cols-2 md:p-10">
                <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                        {current?.title}
                    </h3>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                        {current?.description}
                    </p>
                </div>
                {current?.image ? (
                    <img
                        src={current.image}
                        alt={current.title}
                        className="aspect-4/3 w-full rounded-2xl object-cover shadow-lg transition duration-500"
                    />
                ) : (
                    <div className="flex aspect-4/3 items-center justify-center rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 text-muted-foreground">
                        Add tab image
                    </div>
                )}
            </div>
        </ContentSection>
    );
}

export const ShowcaseTabsComponentConfig: ComponentConfig<ShowcaseTabsComponentProps> =
    {
        label: 'Interactive Tabs',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            tabs: {
                type: 'array',
                label: 'Tabs',
                max: 5,
                arrayFields: {
                    label: {
                        type: 'text',
                        label: 'Tab Label',
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
                    image: imageField('Image'),
                },
                getItemSummary: (item) => item.label || 'Tab',
            },
        } as ComponentConfig<ShowcaseTabsComponentProps>['fields'],
        defaultProps: {
            badge: 'Discover',
            header: 'Explore by Experience',
            description: 'Switch between curated travel themes',
            ...contentStyleDefaults,
            background: 'gradient',
            tabs: [
                {
                    label: 'Adventure',
                    title: 'Thrilling Expeditions',
                    description:
                        'Trek volcanoes, dive coral reefs, and chase sunsets across rugged landscapes.',
                    image: '',
                },
                {
                    label: 'Culture',
                    title: 'Immersive Heritage',
                    description:
                        'Walk ancient streets, taste local cuisine, and connect with communities worldwide.',
                    image: '',
                },
                {
                    label: 'Relaxation',
                    title: 'Pure Serenity',
                    description:
                        'Unwind at luxury resorts, spa retreats, and pristine beaches made for recharging.',
                    image: '',
                },
            ],
        },
        render: (props) => <ShowcaseTabsView {...props} />,
    };
