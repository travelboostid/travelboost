import type { ComponentConfig } from '@puckeditor/core';
import {
    FeatureRow,
    FeaturesSectionShell,
    defaultFeatureItems,
    featuresContentFields,
    featuresStyleDefaults,
    featuresStyleFields,
    type FeaturesStyleProps,
} from '../../components/features-shared';

export type Features2ComponentProps = FeaturesStyleProps & {
    badge: string;
    header: string;
    description: string;
    features: { icon: string; title: string; description: string }[];
};

export const Features2ComponentConfig: ComponentConfig<Features2ComponentProps> =
    {
        label: 'Icon List',
        fields: {
            ...featuresContentFields(),
            ...featuresStyleFields,
        } as ComponentConfig<Features2ComponentProps>['fields'],
        defaultProps: {
            badge: 'Benefits',
            header: 'Travel With Confidence',
            description:
                'We handle the details so you can focus on making memories.',
            ...featuresStyleDefaults,
            background: 'muted',
            columns: 2,
            features: defaultFeatureItems.slice(0, 4),
        },
        render: ({
            badge,
            header,
            description,
            features,
            columns,
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
                columns={columns}
            >
                <div className="mx-auto grid max-w-3xl gap-4">
                    {features.map((feature, i) => (
                        <FeatureRow key={i} feature={feature} />
                    ))}
                </div>
            </FeaturesSectionShell>
        ),
    };
