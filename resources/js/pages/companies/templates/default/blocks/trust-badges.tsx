import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { LUCIDE_ICON_NAMES, LucideIconRenderer } from '../utils';

export type TrustBadge = {
    icon: string;
    title: string;
    description: string;
};

export type TrustBadgesComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    items: TrustBadge[];
};

export const TrustBadgesComponentConfig: ComponentConfig<TrustBadgesComponentProps> =
    {
        label: 'Trust Badges',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            items: {
                type: 'array',
                label: 'Badges',
                max: 6,
                arrayFields: {
                    icon: {
                        type: 'select',
                        label: 'Icon',
                        options: LUCIDE_ICON_NAMES.slice(0, 50).map((n) => ({
                            label: n,
                            value: n,
                        })),
                    },
                    title: {
                        type: 'text',
                        label: 'Title',
                        contentEditable: true,
                    },
                    description: {
                        type: 'text',
                        label: 'Description',
                        contentEditable: true,
                    },
                },
                getItemSummary: (item) => item.title || 'Badge',
            },
        } as ComponentConfig<TrustBadgesComponentProps>['fields'],
        defaultProps: {
            badge: 'Why Trust Us',
            header: 'Travel With Complete Peace of Mind',
            description: 'Your safety and satisfaction are our top priorities',
            ...contentStyleDefaults,
            background: 'muted',
            items: [
                {
                    icon: 'ShieldCheck',
                    title: 'Fully Insured',
                    description: 'Comprehensive coverage on every trip',
                },
                {
                    icon: 'BadgeCheck',
                    title: 'Verified Guides',
                    description: 'Licensed local experts only',
                },
                {
                    icon: 'RefreshCw',
                    title: 'Free Cancellation',
                    description: 'Flexible booking up to 48 hours',
                },
                {
                    icon: 'Headphones',
                    title: '24/7 Support',
                    description: 'Help whenever you need it',
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-background/60 p-6 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
                        >
                            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 transition group-hover:bg-primary/20">
                                <LucideIconRenderer
                                    name={item.icon}
                                    className="size-6 text-primary"
                                />
                            </div>
                            <h3 className="font-semibold text-foreground">
                                {item.title}
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </ContentSection>
        ),
    };
