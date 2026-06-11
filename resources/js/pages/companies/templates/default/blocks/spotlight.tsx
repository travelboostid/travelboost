import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { SparklesIcon, StarIcon } from 'lucide-react';
import {
    ContentSection,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type SpotlightComponentProps = ContentStyleProps & {
    badge: string;
    title: string;
    description: string;
    imageUrl: string;
    price: string;
    rating: string;
    reviewCount: string;
    tag: string;
    ctaLabel: string;
    ctaHref: string;
    highlights: { text: string }[];
};

export const SpotlightComponentConfig: ComponentConfig<SpotlightComponentProps> =
    {
        label: 'Spotlight Feature',
        fields: {
            badge: { type: 'text', label: 'Badge', contentEditable: true },
            title: { type: 'text', label: 'Title', contentEditable: true },
            description: {
                type: 'textarea',
                label: 'Description',
                contentEditable: true,
            },
            imageUrl: imageField('Hero Image'),
            price: { type: 'text', label: 'Price', contentEditable: true },
            rating: { type: 'text', label: 'Rating' },
            reviewCount: { type: 'text', label: 'Review Count' },
            tag: { type: 'text', label: 'Tag', contentEditable: true },
            ctaLabel: {
                type: 'text',
                label: 'Button Label',
                contentEditable: true,
            },
            ctaHref: { type: 'text', label: 'Button URL' },
            highlights: {
                type: 'array',
                label: 'Floating Highlights',
                max: 3,
                arrayFields: {
                    text: {
                        type: 'text',
                        label: 'Text',
                        contentEditable: true,
                    },
                },
                getItemSummary: (item) => item.text || 'Highlight',
            },
            ...contentStyleFields,
        } as ComponentConfig<SpotlightComponentProps>['fields'],
        defaultProps: {
            badge: 'Featured Trip',
            title: 'Bali Paradise Escape',
            description:
                '7 days of temples, rice terraces, and beachfront bliss with a private guide and luxury villa stay.',
            ...contentStyleDefaults,
            padding: 'xl',
            background: 'none',
            imageUrl: '',
            price: 'From $1,299',
            rating: '4.9',
            reviewCount: '2.4k reviews',
            tag: 'Best Seller',
            ctaLabel: 'Book This Trip',
            ctaHref: '/tours',
            highlights: [
                { text: 'Free cancellation' },
                { text: 'All-inclusive' },
            ],
        },
        render: ({
            badge,
            title,
            description,
            imageUrl,
            price,
            rating,
            reviewCount,
            tag,
            ctaLabel,
            ctaHref,
            highlights,
            padding,
            maxWidth,
            editMode,
        }) => (
            <ContentSection
                padding={padding}
                background="none"
                maxWidth={maxWidth}
            >
                <div className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-primary/10 via-background to-secondary/10 p-6 md:p-10 lg:p-14">
                    <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/20 blur-3xl animate-[puck-glow-pulse_4s_ease-in-out_infinite]" />
                    <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-secondary/20 blur-3xl" />
                    <div className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
                        <div className="space-y-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <Badge className="gap-1">
                                    <SparklesIcon className="size-3" />
                                    {badge}
                                </Badge>
                                {tag && <Badge variant="outline">{tag}</Badge>}
                            </div>
                            <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
                                {title}
                            </h2>
                            <p className="text-lg leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <span className="text-3xl font-bold text-primary">
                                    {price}
                                </span>
                                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <StarIcon className="size-4 fill-primary text-primary" />
                                    {rating} · {reviewCount}
                                </span>
                            </div>
                            {editMode ? (
                                <Button size="lg">{ctaLabel}</Button>
                            ) : (
                                <Button size="lg" asChild>
                                    <Link href={ctaHref}>{ctaLabel}</Link>
                                </Button>
                            )}
                        </div>
                        <div className="relative">
                            {highlights.map((h, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'absolute z-10 rounded-xl border border-white/20 bg-background/90 px-4 py-2 text-sm font-medium shadow-xl backdrop-blur-md animate-[puck-float_3s_ease-in-out_infinite]',
                                        i === 0 && '-top-2 -left-2 md:-left-6',
                                        i === 1 &&
                                            'top-1/3 -right-2 md:-right-6',
                                        i === 2 && '-bottom-2 left-1/4',
                                    )}
                                    style={{ animationDelay: `${i * 0.5}s` }}
                                >
                                    {h.text}
                                </div>
                            ))}
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="relative aspect-[4/5] w-full rounded-3xl object-cover shadow-2xl ring-1 ring-border/50"
                                />
                            ) : (
                                <div className="flex aspect-[4/5] items-center justify-center rounded-3xl bg-muted text-muted-foreground">
                                    Add spotlight image
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ContentSection>
        ),
    };
