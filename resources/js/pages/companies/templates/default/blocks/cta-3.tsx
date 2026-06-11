import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import {
    CtaActions,
    ctaContentFields,
    ctaInnerClass,
    ctaShellClass,
    ctaStyleDefaults,
    ctaStyleFields,
    defaultCtaActions,
    isCtaInverted,
    type CtaStyleProps,
} from '../../components/cta-shared';

export type Cta3ComponentProps = CtaStyleProps & {
    badge: string;
    header: string;
    description: string;
    actions: LinkButtonComponentProps[];
};

export const Cta3ComponentConfig: ComponentConfig<Cta3ComponentProps> = {
    label: 'Compact Strip',
    fields: {
        ...ctaContentFields,
        ...ctaStyleFields,
    } as ComponentConfig<Cta3ComponentProps>['fields'],
    defaultProps: {
        badge: 'Special Offer',
        header: 'Get 20% Off Your First Trip',
        description: 'Limited time offer for new travelers',
        ...ctaStyleDefaults,
        padding: 'md',
        actions: [defaultCtaActions[0]],
    },
    render: ({
        badge,
        header,
        description,
        actions,
        padding,
        background,
        maxWidth,
        editMode,
    }) => {
        const style: CtaStyleProps = {
            padding,
            align: 'left',
            background,
            maxWidth,
        };
        const inverted = isCtaInverted(background);

        return (
            <section className={ctaShellClass(style)}>
                <div className={ctaInnerClass(maxWidth)}>
                    <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:flex-row md:items-center md:p-8">
                        <div className="space-y-2">
                            {badge && (
                                <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                                    {badge}
                                </span>
                            )}
                            <h2
                                className={cn(
                                    'text-2xl font-bold md:text-3xl',
                                    inverted
                                        ? 'text-primary-foreground'
                                        : 'text-foreground',
                                )}
                            >
                                {header}
                            </h2>
                            {description && (
                                <p className="text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        <CtaActions
                            actions={actions}
                            align="right"
                            editMode={editMode}
                            className="shrink-0"
                        />
                    </div>
                </div>
            </section>
        );
    },
};
