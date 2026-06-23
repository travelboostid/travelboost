import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { heroImageField } from '../../components/fields';
import {
    HeroActions,
    HeroBadge,
    HeroDescription,
    HeroHeadline,
    HeroImage,
    HeroStats,
    defaultHeroActions,
    defaultHeroSummaries,
    heroContentFields,
    heroInnerClass,
    heroShellClass,
    heroStyleDefaults,
    heroStyleFields,
    type HeroStyleProps,
} from '../../components/hero-shared';
import type { SectionAlign } from '../../components/section-styles';

export type Hero4ComponentProps = HeroStyleProps & {
    badge: string;
    header: string;
    description: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
    actions: LinkButtonComponentProps[];
    summaries: { title: string; subtitle?: string }[];
};

export const Hero4ComponentConfig: ComponentConfig<Hero4ComponentProps> = {
    label: 'Split Showcase',
    fields: {
        ...heroContentFields,
        ...heroStyleFields,
        imageUrl: heroImageField('Hero Image'),
        imagePosition: {
            type: 'select',
            label: 'Image Position',
            options: [
                { value: 'right', label: 'Right' },
                { value: 'left', label: 'Left' },
            ],
        },
        summaries: {
            label: 'Stats',
            type: 'array',
            max: 4,
            arrayFields: {
                title: { type: 'text', contentEditable: true },
                subtitle: { type: 'text', contentEditable: true },
            },
            getItemSummary: (item) => item.title || 'Stat',
        },
    } as ComponentConfig<Hero4ComponentProps>['fields'],
    defaultProps: {
        badge: 'Travel Agency',
        header: 'Your Next Adventure Starts Here',
        description:
            'Curated journeys, expert local guides, and unforgettable experiences — all tailored to how you love to travel.',
        ...heroStyleDefaults,
        background: 'gradient',
        align: 'left',
        imageUrl: '',
        imagePosition: 'right',
        actions: defaultHeroActions,
        summaries: defaultHeroSummaries,
    },
    render: ({
        badge,
        header,
        description,
        imageUrl,
        imagePosition,
        actions,
        summaries,
        align,
        padding,
        background,
        maxWidth,
        minHeight,
        overlay,
        editMode,
    }) => {
        const style: HeroStyleProps = {
            padding,
            align,
            background,
            maxWidth,
            minHeight,
            overlay,
        };
        const inverted = style.background === 'primary';

        const content = (
            <div className="space-y-2">
                <HeroBadge badge={badge} align={align} inverted={inverted} />
                <HeroHeadline
                    header={header}
                    align={align}
                    inverted={inverted}
                    size="lg"
                />
                <HeroDescription
                    description={description}
                    align={align}
                    inverted={inverted}
                />
                <HeroActions
                    actions={actions}
                    align={align}
                    editMode={editMode}
                />
                <HeroStats
                    summaries={summaries}
                    align={align as SectionAlign}
                    inverted={inverted}
                />
            </div>
        );

        const visual = (
            <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-2xl" />
                <HeroImage
                    src={imageUrl}
                    className="relative aspect-[4/5] max-h-[560px] md:aspect-auto md:h-[520px]"
                    rounded="3xl"
                />
            </div>
        );

        return (
            <section className={heroShellClass(style)}>
                <div className={heroInnerClass(style.maxWidth)}>
                    <div
                        className={cn(
                            'grid items-center gap-12 lg:grid-cols-2 lg:gap-16',
                            imagePosition === 'left' &&
                                'lg:[&>*:first-child]:order-2',
                        )}
                    >
                        {imagePosition === 'left' ? (
                            <>
                                {visual}
                                {content}
                            </>
                        ) : (
                            <>
                                {content}
                                {visual}
                            </>
                        )}
                    </div>
                </div>
            </section>
        );
    },
};
