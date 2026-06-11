import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import {
    CtaActions,
    CtaSectionHeader,
    ctaContentFields,
    ctaInnerClass,
    ctaShellClass,
    ctaStyleDefaults,
    ctaStyleFields,
    defaultCtaActions,
    isCtaInverted,
    type CtaStyleProps,
} from '../../components/cta-shared';

export type CtaComponentProps = CtaStyleProps & {
    badge: string;
    header: string;
    description: string;
    actions: LinkButtonComponentProps[];
};

export const CtaComponentConfig: ComponentConfig<CtaComponentProps> = {
    label: 'Centered Banner',
    fields: {
        ...ctaContentFields,
        ...ctaStyleFields,
    } as ComponentConfig<CtaComponentProps>['fields'],
    defaultProps: {
        badge: '',
        header: 'Ready for Your Adventure?',
        description: 'Join thousands of travelers exploring the world with us',
        ...ctaStyleDefaults,
        actions: [defaultCtaActions[0]],
    },
    render: ({
        badge,
        header,
        description,
        actions,
        align,
        padding,
        background,
        maxWidth,
        editMode,
    }) => {
        const style: CtaStyleProps = { padding, align, background, maxWidth };
        const inverted = isCtaInverted(background);

        return (
            <section
                className={cn(
                    ctaShellClass(style),
                    inverted && 'text-primary-foreground',
                )}
            >
                <div className={cn(ctaInnerClass(maxWidth), 'space-y-8')}>
                    <CtaSectionHeader
                        badge={badge}
                        header={header}
                        description={description}
                        align={align}
                        inverted={inverted}
                    />
                    <CtaActions
                        actions={actions}
                        align={align}
                        editMode={editMode}
                    />
                </div>
            </section>
        );
    },
};
