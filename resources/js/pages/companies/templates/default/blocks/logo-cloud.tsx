import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { imageField } from '../../components/fields';
import {
    sectionContainerClass,
    SectionHeader,
    sectionHeaderFields,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from '../../components/section-styles';

export type LogoCloudStyle = 'plain' | 'cards' | 'marquee';

export type LogoCloudComponentProps = {
    badge: string;
    header: string;
    description: string;
    style: LogoCloudStyle;
    grayscale: boolean;
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    logos: { image: string; alt: string; href: string }[];
};

export const LogoCloudComponentConfig: ComponentConfig<LogoCloudComponentProps> =
    {
        label: 'Logo Cloud',
        fields: {
            ...sectionHeaderFields(),
            ...sectionStyleFields,
            style: {
                type: 'select',
                label: 'Display Style',
                options: [
                    { value: 'plain', label: 'Plain Row' },
                    { value: 'cards', label: 'Logo Cards' },
                    { value: 'marquee', label: 'Scrolling Marquee' },
                ],
            },
            grayscale: {
                type: 'radio',
                label: 'Grayscale Logos',
                options: [
                    { value: true, label: 'Yes' },
                    { value: false, label: 'No' },
                ],
            },
            logos: {
                type: 'array',
                label: 'Logos',
                max: 12,
                arrayFields: {
                    image: imageField('Logo'),
                    alt: { type: 'text', label: 'Alt Text' },
                    href: { type: 'text', label: 'Link URL (optional)' },
                },
                getItemSummary: (item) => item.alt || 'Logo',
            },
        },
        defaultProps: {
            badge: 'Partners',
            header: 'Trusted by Leading Travel Partners',
            description: '',
            ...sectionStyleDefaults,
            background: 'muted',
            style: 'cards',
            grayscale: true,
            logos: [
                { image: '', alt: 'Partner 1', href: '' },
                { image: '', alt: 'Partner 2', href: '' },
                { image: '', alt: 'Partner 3', href: '' },
                { image: '', alt: 'Partner 4', href: '' },
                { image: '', alt: 'Partner 5', href: '' },
            ],
        },
        render: ({
            badge,
            header,
            description,
            style,
            grayscale,
            padding,
            align,
            background,
            maxWidth,
            logos,
        }) => {
            const logoImageClass = cn(
                'max-h-10 max-w-full object-contain transition duration-300',
                grayscale &&
                    'opacity-60 grayscale hover:opacity-100 hover:grayscale-0',
            );

            const renderLogo = (
                logo: LogoCloudComponentProps['logos'][0],
                i: number,
            ) => {
                const img = logo.image ? (
                    <img
                        src={logo.image}
                        alt={logo.alt}
                        className={logoImageClass}
                    />
                ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                        {logo.alt}
                    </span>
                );

                const wrapperClass =
                    style === 'cards'
                        ? 'flex h-20 w-full items-center justify-center rounded-xl border border-border/60 bg-background/80 px-6 shadow-sm transition hover:border-primary/30 hover:shadow-md'
                        : 'flex h-14 w-36 items-center justify-center';

                const content = <div className={wrapperClass}>{img}</div>;

                if (logo.href) {
                    return (
                        <a
                            key={i}
                            href={logo.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                        >
                            {content}
                        </a>
                    );
                }

                return <div key={i}>{content}</div>;
            };

            return (
                <section
                    className={cn(
                        sectionContainerClass({ padding, background }),
                        style === 'marquee' && 'overflow-hidden',
                    )}
                >
                    <div className={sectionInnerClass(maxWidth)}>
                        <SectionHeader
                            badge={badge}
                            header={header}
                            description={description}
                            align={align}
                            inverted={background === 'primary'}
                        />
                        {style === 'marquee' ? (
                            <div className="relative">
                                <div className="flex animate-[puck-logo-marquee_30s_linear_infinite] gap-12 hover:[animation-play-state:paused]">
                                    {[...logos, ...logos].map((logo, i) =>
                                        renderLogo(logo, i),
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    style === 'cards'
                                        ? 'grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'
                                        : 'flex flex-wrap items-center justify-center gap-x-12 gap-y-8',
                                )}
                            >
                                {logos.map((logo, i) => renderLogo(logo, i))}
                            </div>
                        )}
                    </div>
                </section>
            );
        },
    };
