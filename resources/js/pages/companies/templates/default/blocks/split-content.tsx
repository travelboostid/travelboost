import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { CheckIcon } from 'lucide-react';
import type { LinkButtonComponentProps } from '../../base/blocks/link-button';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField, linkButtonActionsField } from '../../components/fields';
import { PuckImage } from '../../components/puck-image';

export type SplitContentComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    imageUrl: string;
    imagePosition: 'left' | 'right';
    bulletPoints: { text: string }[];
    actions: LinkButtonComponentProps[];
};

export const SplitContentComponentConfig: ComponentConfig<SplitContentComponentProps> =
    {
        label: 'Split Image + Text',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            imageUrl: imageField('Image'),
            imagePosition: {
                type: 'select',
                label: 'Image Position',
                options: [
                    { value: 'right', label: 'Right' },
                    { value: 'left', label: 'Left' },
                ],
            },
            bulletPoints: {
                type: 'array',
                label: 'Bullet Points',
                max: 6,
                arrayFields: {
                    text: {
                        type: 'text',
                        label: 'Point',
                        contentEditable: true,
                    },
                },
                getItemSummary: (item) => item.text || 'Point',
            },
            actions: linkButtonActionsField('Buttons', 2),
        } as ComponentConfig<SplitContentComponentProps>['fields'],
        defaultProps: {
            badge: 'Our Story',
            header: 'Crafting Unforgettable Journeys Since 2010',
            description:
                'We believe travel should be transformative. Every itinerary is personally curated by experts who have explored these destinations firsthand.',
            ...contentStyleDefaults,
            align: 'left',
            background: 'muted',
            imageUrl: '',
            imagePosition: 'right',
            bulletPoints: [
                { text: 'Local expert guides in every destination' },
                { text: 'Flexible booking and cancellation' },
                { text: '24/7 support throughout your trip' },
                { text: 'Sustainable and responsible tourism' },
            ],
            actions: [
                {
                    variant: 'default',
                    label: 'Learn More',
                    size: 'default',
                    disabled: false,
                    className: '',
                    type: 'button',
                    href: '/tours',
                    target: '_self',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            imageUrl,
            imagePosition,
            bulletPoints,
            actions,
            align,
            padding,
            background,
            maxWidth,
            editMode,
        }) => {
            const textBlock = (
                <div className="space-y-6">
                    {badge && (
                        <span className="text-xs font-semibold tracking-wide text-primary uppercase">
                            {badge}
                        </span>
                    )}
                    <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                        {header}
                    </h2>
                    <p className="text-lg leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                    {bulletPoints.length > 0 && (
                        <ul className="space-y-3">
                            {bulletPoints.map((point, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <CheckIcon className="size-3 text-primary" />
                                    </span>
                                    <span className="text-foreground">
                                        {point.text}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {actions.length > 0 && (
                        <div className="flex flex-wrap gap-3 pt-2">
                            {actions.map(
                                ({ label, href, target, ...props }, i) =>
                                    editMode ? (
                                        <Button key={i} {...props}>
                                            {label}
                                        </Button>
                                    ) : (
                                        <Button key={i} {...props} asChild>
                                            <Link href={href} target={target}>
                                                {label}
                                            </Link>
                                        </Button>
                                    ),
                            )}
                        </div>
                    )}
                </div>
            );

            const imageBlock = imageUrl ? (
                <PuckImage
                    src={imageUrl}
                    alt={header}
                    className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl"
                />
            ) : (
                <div className="flex aspect-[4/3] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    Add image
                </div>
            );

            return (
                <ContentSection
                    align={align}
                    padding={padding}
                    background={background}
                    maxWidth={maxWidth}
                >
                    <div
                        className={cn(
                            'grid items-center gap-10 lg:grid-cols-2 lg:gap-16',
                        )}
                    >
                        {imagePosition === 'left' ? (
                            <>
                                {imageBlock}
                                {textBlock}
                            </>
                        ) : (
                            <>
                                {textBlock}
                                {imageBlock}
                            </>
                        )}
                    </div>
                </ContentSection>
            );
        },
    };
