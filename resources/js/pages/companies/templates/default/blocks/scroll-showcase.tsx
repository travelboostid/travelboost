import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { ArrowRightIcon, MapPinIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type ScrollCard = {
    image: string;
    title: string;
    location: string;
    price: string;
    href: string;
};

export type ScrollShowcaseComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    cards: ScrollCard[];
};

export const ScrollShowcaseComponentConfig: ComponentConfig<ScrollShowcaseComponentProps> =
    {
        label: 'Horizontal Scroll',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            cards: {
                type: 'array',
                label: 'Cards',
                max: 12,
                arrayFields: {
                    image: imageField('Image'),
                    title: {
                        type: 'text',
                        label: 'Title',
                        contentEditable: true,
                    },
                    location: {
                        type: 'text',
                        label: 'Location',
                        contentEditable: true,
                    },
                    price: {
                        type: 'text',
                        label: 'Price',
                        contentEditable: true,
                    },
                    href: { type: 'text', label: 'Link URL' },
                },
                getItemSummary: (item) => item.title || 'Card',
            },
        } as ComponentConfig<ScrollShowcaseComponentProps>['fields'],
        defaultProps: {
            badge: 'Trending Now',
            header: 'Swipe Through Adventures',
            description: 'Hand-picked experiences travelers love right now',
            ...contentStyleDefaults,
            background: 'none',
            cards: [
                {
                    image: '',
                    title: 'Northern Lights Safari',
                    location: 'Iceland',
                    price: '$899',
                    href: '/tours',
                },
                {
                    image: '',
                    title: 'Safari & Serengeti',
                    location: 'Tanzania',
                    price: '$2,199',
                    href: '/tours',
                },
                {
                    image: '',
                    title: 'Amalfi Coast Drive',
                    location: 'Italy',
                    price: '$1,499',
                    href: '/tours',
                },
                {
                    image: '',
                    title: 'Kyoto Temple Trail',
                    location: 'Japan',
                    price: '$1,099',
                    href: '/tours',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            cards,
            padding,
            align,
            background,
            maxWidth,
            editMode,
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
                <div className="relative -mx-4 md:-mx-6">
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r from-background to-transparent md:w-20" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l from-background to-transparent md:w-20" />
                    <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 md:gap-6 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {cards.map((card, i) => (
                            <article
                                key={i}
                                className="group w-[280px] shrink-0 snap-start sm:w-[320px]"
                            >
                                <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                                    {card.image ? (
                                        <img
                                            src={card.image}
                                            alt={card.title}
                                            className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="flex aspect-[3/4] items-center justify-center bg-muted text-sm text-muted-foreground">
                                            Add image
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                        <Badge className="mb-2 bg-white/20 text-white backdrop-blur-sm">
                                            {card.price}
                                        </Badge>
                                        <h3 className="text-xl font-bold">
                                            {card.title}
                                        </h3>
                                        <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
                                            <MapPinIcon className="size-3.5" />
                                            {card.location}
                                        </p>
                                        {editMode ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="mt-4 gap-1"
                                            >
                                                Explore
                                                <ArrowRightIcon className="size-4" />
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="mt-4 gap-1"
                                                asChild
                                            >
                                                <Link href={card.href}>
                                                    Explore
                                                    <ArrowRightIcon className="size-4" />
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </ContentSection>
        ),
    };
