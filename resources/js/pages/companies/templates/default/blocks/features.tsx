import type { ComponentConfig } from '@puckeditor/core';
import {
    FeatureCard,
    FeaturesSectionShell,
    columnGridClass,
    defaultFeatureItems,
    featuresContentFields,
    featuresStyleDefaults,
    featuresStyleFields,
    type FeaturesStyleProps,
} from '../../components/features-shared';

export type FeaturesComponentProps = FeaturesStyleProps & {
    badge: string;
    header: string;
    description: string;
    features: { icon: string; title: string; description: string }[];
};

export const FeaturesComponentConfig: ComponentConfig<FeaturesComponentProps> =
    {
        label: 'Card Grid',
        fields: {
            ...featuresContentFields(),
            ...featuresStyleFields,
        } as ComponentConfig<FeaturesComponentProps>['fields'],
        defaultProps: {
            badge: 'Why Us',
            header: 'Why Choose Us',
            description: 'Everything you need for the perfect journey',
            ...featuresStyleDefaults,
            features: defaultFeatureItems,
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
                inverted={background === 'primary'}
            >
                <div className={columnGridClass(columns)}>
                    {features.map((feature, i) => (
                        <FeatureCard key={i} feature={feature} />
                    ))}
                </div>
            </FeaturesSectionShell>
        ),
    };
