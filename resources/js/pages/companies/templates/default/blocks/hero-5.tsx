import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import { heroImageField } from '../../components/fields';
import {
    HeroActions,
    HeroBackground,
    HeroBadge,
    HeroDescription,
    HeroHeadline,
    defaultHeroActions,
    heroContentFields,
    heroInnerClass,
    heroStyleDefaults,
    heroStyleFields,
    type HeroStyleProps,
} from '../../components/hero-shared';

export type Hero5ComponentProps = HeroStyleProps & {
    badge: string;
    header: string;
    description: string;
    backgroundUrl: string;
    glassEffect: boolean;
    actions: LinkButtonComponentProps[];
};

export const Hero5ComponentConfig: ComponentConfig<Hero5ComponentProps> = {
    label: 'Cinematic Glass',
    fields: {
        ...heroContentFields,
        ...heroStyleFields,
        backgroundUrl: heroImageField('Background Image'),
        glassEffect: {
            type: 'radio',
            label: 'Glass Card Effect',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
    } as ComponentConfig<Hero5ComponentProps>['fields'],
    defaultProps: {
        badge: 'Discover Paradise',
        header: 'Escape to Extraordinary Destinations',
        description:
            'From hidden beaches to mountain peaks — find your perfect getaway with handpicked packages and 24/7 travel support.',
        ...heroStyleDefaults,
        padding: 'xl',
        align: 'center',
        minHeight: 'screen',
        overlay: 'dark',
        backgroundUrl: '',
        glassEffect: true,
        actions: defaultHeroActions,
    },
    render: ({
        badge,
        header,
        description,
        backgroundUrl,
        overlay,
        glassEffect,
        actions,
        align,
        padding,
        background,
        maxWidth,
        minHeight,
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

        return (
            <HeroBackground
                imageUrl={backgroundUrl}
                overlay={overlay}
                className={cn(
                    'flex items-center px-4 sm:px-6 lg:px-8',
                    style.minHeight === 'screen' && 'min-h-screen',
                    style.minHeight === 'tall' && 'min-h-[80vh]',
                    style.minHeight === 'medium' && 'min-h-[60vh]',
                )}
            >
                <div
                    className={cn(
                        heroInnerClass(style.maxWidth),
                        'py-20 md:py-32',
                    )}
                >
                    <div
                        className={cn(
                            'mx-auto max-w-3xl',
                            glassEffect &&
                                'rounded-3xl border border-white/20 bg-background/40 p-8 shadow-2xl backdrop-blur-xl md:p-12',
                            align === 'left' && 'mr-auto ml-0 text-left',
                            align === 'right' && 'mr-0 ml-auto text-right',
                            align === 'center' && 'text-center',
                        )}
                    >
                        <HeroBadge badge={badge} align={align} inverted />
                        <HeroHeadline
                            header={header}
                            align={align}
                            inverted
                            size="xl"
                        />
                        <HeroDescription
                            description={description}
                            align={align}
                            inverted
                        />
                        <HeroActions
                            actions={actions}
                            align={align}
                            editMode={editMode}
                        />
                    </div>
                </div>
            </HeroBackground>
        );
    },
};
