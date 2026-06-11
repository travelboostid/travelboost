import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { QuoteIcon, StarIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type WallQuote = {
    quote: string;
    author: string;
    role: string;
    avatar: string;
    rating: number;
    featured: boolean;
};

export type TestimonialWallComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    quotes: WallQuote[];
};

export const TestimonialWallComponentConfig: ComponentConfig<TestimonialWallComponentProps> =
    {
        label: 'Testimonial Wall',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            quotes: {
                type: 'array',
                label: 'Quotes',
                max: 8,
                arrayFields: {
                    quote: {
                        type: 'textarea',
                        label: 'Quote',
                        contentEditable: true,
                    },
                    author: {
                        type: 'text',
                        label: 'Author',
                        contentEditable: true,
                    },
                    role: {
                        type: 'text',
                        label: 'Role',
                        contentEditable: true,
                    },
                    avatar: imageField('Avatar'),
                    rating: {
                        type: 'number',
                        label: 'Rating (1-5)',
                        min: 1,
                        max: 5,
                    },
                    featured: {
                        type: 'radio',
                        label: 'Featured (large)',
                        options: [
                            { value: true, label: 'Yes' },
                            { value: false, label: 'No' },
                        ],
                    },
                },
                getItemSummary: (item) => item.author || 'Quote',
            },
        } as ComponentConfig<TestimonialWallComponentProps>['fields'],
        defaultProps: {
            badge: 'Reviews',
            header: 'Loved by Travelers Worldwide',
            description: 'Real stories from real adventures',
            ...contentStyleDefaults,
            background: 'gradient',
            quotes: [
                {
                    quote: 'The best trip of my life. Every detail was perfect — from the guides to the hidden gems they showed us.',
                    author: 'Sarah Mitchell',
                    role: 'Adventure Traveler',
                    avatar: '',
                    rating: 5,
                    featured: true,
                },
                {
                    quote: 'Seamless booking and incredible support when our flight was delayed.',
                    author: 'James Chen',
                    role: 'Family Vacation',
                    avatar: '',
                    rating: 5,
                    featured: false,
                },
                {
                    quote: 'Exceeded expectations. Will definitely book again!',
                    author: 'Emma Rodriguez',
                    role: 'Solo Explorer',
                    avatar: '',
                    rating: 5,
                    featured: false,
                },
                {
                    quote: 'Professional, passionate, and truly local expertise.',
                    author: 'David Park',
                    role: 'Photography Tour',
                    avatar: '',
                    rating: 5,
                    featured: false,
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            quotes,
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
                inverted={background === 'gradient' || background === 'primary'}
            >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quotes.map((q, i) => (
                        <figure
                            key={i}
                            className={cn(
                                'group relative overflow-hidden rounded-2xl border border-white/10 bg-background/80 p-6 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl',
                                q.featured &&
                                    'md:col-span-2 lg:row-span-2 lg:p-8',
                            )}
                        >
                            <QuoteIcon className="mb-3 size-8 text-primary/40" />
                            <blockquote
                                className={cn(
                                    'leading-relaxed text-foreground',
                                    q.featured
                                        ? 'text-lg md:text-xl'
                                        : 'text-sm md:text-base',
                                )}
                            >
                                "{q.quote}"
                            </blockquote>
                            <div className="mt-5 flex items-center gap-3">
                                {q.avatar ? (
                                    <img
                                        src={q.avatar}
                                        alt={q.author}
                                        className="size-10 rounded-full object-cover ring-2 ring-primary/20"
                                    />
                                ) : (
                                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                        {q.author.charAt(0)}
                                    </div>
                                )}
                                <figcaption>
                                    <p className="font-semibold text-foreground">
                                        {q.author}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {q.role}
                                    </p>
                                </figcaption>
                                <div className="ml-auto flex gap-0.5">
                                    {Array.from({ length: q.rating }).map(
                                        (_, s) => (
                                            <StarIcon
                                                key={s}
                                                className="size-4 fill-primary text-primary"
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        </figure>
                    ))}
                </div>
            </ContentSection>
        ),
    };
