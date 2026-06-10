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

export type Cta2ComponentProps = CtaStyleProps & {
    badge: string;
    header: string;
    description: string;
    cardTitle: string;
    cardDescription: string;
    actions: LinkButtonComponentProps[];
};

export const Cta2ComponentConfig: ComponentConfig<Cta2ComponentProps> = {
    label: 'Split Card',
    fields: {
        ...ctaContentFields,
        ...ctaStyleFields,
        cardTitle: {
            type: 'text',
            label: 'Card Title',
            contentEditable: true,
        },
        cardDescription: {
            type: 'text',
            label: 'Card Description',
            contentEditable: true,
        },
    } as ComponentConfig<Cta2ComponentProps>['fields'],
    defaultProps: {
        badge: 'Limited Offer',
        header: 'Ready to Explore the World?',
        description:
            'Book your next adventure today and get exclusive early-bird pricing on select destinations.',
        cardTitle: 'Start Planning',
        cardDescription: 'Free consultation with our travel experts',
        ...ctaStyleDefaults,
        background: 'gradient',
        align: 'left',
        actions: defaultCtaActions,
    },
    render: ({
        badge,
        header,
        description,
        cardTitle,
        cardDescription,
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
            <section className={ctaShellClass(style)}>
                <div className={ctaInnerClass(maxWidth)}>
                    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                        <CtaSectionHeader
                            badge={badge}
                            header={header}
                            description={description}
                            align={align}
                            inverted={inverted}
                        />
                        <div className="rounded-2xl border border-border/60 bg-card p-8 shadow-xl md:p-10">
                            <h3 className="text-2xl font-bold text-foreground">
                                {cardTitle}
                            </h3>
                            <p className="mt-2 text-muted-foreground">
                                {cardDescription}
                            </p>
                            <CtaActions
                                actions={actions}
                                align="left"
                                editMode={editMode}
                                className="mt-6"
                            />
                        </div>
                    </div>
                </div>
            </section>
        );
    },
};
