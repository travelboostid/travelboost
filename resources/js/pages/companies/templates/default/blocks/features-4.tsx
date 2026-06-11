import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    FeatureIcon,
    FeaturesSectionShell,
    defaultFeatureItems,
    featuresContentFields,
    featuresStyleDefaults,
    featuresStyleFields,
    type FeatureItem,
    type FeaturesStyleProps,
} from '../../components/features-shared';

export type Features4ComponentProps = FeaturesStyleProps & {
    badge: string;
    header: string;
    description: string;
    features: FeatureItem[];
};

export const Features4ComponentConfig: ComponentConfig<Features4ComponentProps> =
    {
        label: 'Alternating Rows',
        fields: {
            ...featuresContentFields(),
            ...featuresStyleFields,
        } as ComponentConfig<Features4ComponentProps>['fields'],
        defaultProps: {
            badge: 'Our Services',
            header: 'How We Make Travel Easy',
            description: 'From planning to return — we are with you every step',
            ...featuresStyleDefaults,
            background: 'default',
            features: defaultFeatureItems.slice(0, 4),
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
                <div className="space-y-12">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex flex-col items-center gap-8 md:flex-row md:gap-16',
                                i % 2 === 1 && 'md:flex-row-reverse',
                            )}
                        >
                            <div className="flex size-32 shrink-0 items-center justify-center rounded-3xl bg-primary/10 md:size-40">
                                <FeatureIcon
                                    icon={feature.icon}
                                    size="lg"
                                    className="size-14 text-primary"
                                />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-2xl font-bold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </FeaturesSectionShell>
        ),
    };
