import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    FeatureCard,
    FeaturesSectionShell,
    defaultFeatureItems,
    featuresContentFields,
    featuresStyleDefaults,
    featuresStyleFields,
    type FeatureItem,
    type FeaturesStyleProps,
} from '../../components/features-shared';

export type Features3ComponentProps = FeaturesStyleProps & {
    badge: string;
    header: string;
    description: string;
    features: FeatureItem[];
};

export const Features3ComponentConfig: ComponentConfig<Features3ComponentProps> =
    {
        label: 'Bento Grid',
        fields: {
            ...featuresContentFields(),
            ...featuresStyleFields,
        } as ComponentConfig<Features3ComponentProps>['fields'],
        defaultProps: {
            badge: 'Highlights',
            header: 'Everything Included',
            description: 'Premium travel experiences designed around you',
            ...featuresStyleDefaults,
            background: 'gradient',
            columns: 3,
            features: defaultFeatureItems.slice(0, 6),
        },
        render: ({
            badge,
            header,
            description,
            features,
            padding,
            align,
            background,
            maxWidth,
        }) => (
            <FeaturesSectionShell
                badge={badge}
                header={header}
                description={description}
                align={align}
                background={background}
                padding={padding}
                maxWidth={maxWidth}
                columns={3}
            >
                <div className="grid auto-rows-[minmax(160px,auto)] gap-4 md:grid-cols-4">
                    {features.map((feature, i) => {
                        const isLarge = i === 0 || i === 3;

                        return (
                            <FeatureCard
                                key={i}
                                feature={feature}
                                className={cn(
                                    'flex flex-col justify-between',
                                    isLarge && 'md:col-span-2 md:row-span-2',
                                    i === 0 && 'bg-primary/5',
                                )}
                            />
                        );
                    })}
                </div>
            </FeaturesSectionShell>
        ),
    };
