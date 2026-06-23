import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import {
    CtaActions,
    CtaSectionHeader,
    ctaContentFields,
    ctaInnerClass,
    ctaStyleDefaults,
    ctaStyleFields,
    defaultCtaActions,
    type CtaStyleProps,
} from '../../components/cta-shared';
import { heroImageField } from '../../components/fields';
import { PuckImage } from '../../components/puck-image';

export type Cta4ComponentProps = CtaStyleProps & {
    badge: string;
    header: string;
    description: string;
    backgroundUrl: string;
    overlay: 'light' | 'dark' | 'gradient';
    actions: LinkButtonComponentProps[];
};

export const Cta4ComponentConfig: ComponentConfig<Cta4ComponentProps> = {
    label: 'Image Banner',
    fields: {
        ...ctaContentFields,
        ...ctaStyleFields,
        backgroundUrl: heroImageField('Background Image'),
        overlay: {
            type: 'select',
            label: 'Overlay',
            options: [
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
                { value: 'gradient', label: 'Gradient' },
            ],
        },
    } as ComponentConfig<Cta4ComponentProps>['fields'],
    defaultProps: {
        badge: 'Adventure Awaits',
        header: 'Your Dream Vacation Is One Click Away',
        description:
            'Browse curated packages, compare options, and book with confidence.',
        ...ctaStyleDefaults,
        padding: 'xl',
        background: 'none',
        align: 'center',
        backgroundUrl: '',
        overlay: 'dark',
        actions: defaultCtaActions,
    },
    render: ({
        badge,
        header,
        description,
        backgroundUrl,
        overlay,
        actions,
        align,
        padding,
        maxWidth,
        editMode,
    }) => {
        const overlayClass = {
            dark: 'bg-black/60',
            light: 'bg-white/70',
            gradient:
                'bg-linear-to-r from-black/70 via-black/50 to-transparent',
        }[overlay];

        return (
            <section
                className={cn(
                    'relative overflow-hidden px-4 sm:px-6 lg:px-8',
                    padding === 'sm' && 'py-12',
                    padding === 'md' && 'py-16',
                    padding === 'lg' && 'py-20',
                    padding === 'xl' && 'py-28',
                    padding === 'none' && 'py-12',
                )}
            >
                {backgroundUrl ? (
                    <PuckImage
                        src={backgroundUrl}
                        alt=""
                        priority
                        className="absolute inset-0 size-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-secondary/20" />
                )}
                <div className={cn('absolute inset-0', overlayClass)} />
                <div className={cn(ctaInnerClass(maxWidth), 'relative z-10')}>
                    <CtaSectionHeader
                        badge={badge}
                        header={header}
                        description={description}
                        align={align}
                        inverted
                    />
                    <CtaActions
                        actions={actions}
                        align={align}
                        editMode={editMode}
                        className="mt-8"
                    />
                </div>
            </section>
        );
    },
};
