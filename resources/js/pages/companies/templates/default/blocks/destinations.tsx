import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { ClockIcon, MapPinIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';
import { PuckImage } from '../../components/puck-image';

export type DestinationItem = {
    image: string;
    title: string;
    location: string;
    price: string;
    duration: string;
    tag: string;
    href: string;
};

export type DestinationsComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    columns: 2 | 3 | 4;
    destinations: DestinationItem[];
};

export const DestinationsComponentConfig: ComponentConfig<DestinationsComponentProps> =
    {
        label: 'Destinations Grid',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            columns: {
                type: 'select',
                label: 'Columns',
                options: [
                    { value: 2, label: '2 Columns' },
                    { value: 3, label: '3 Columns' },
                    { value: 4, label: '4 Columns' },
                ],
            },
            destinations: {
                type: 'array',
                label: 'Destinations',
                max: 8,
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
                    duration: {
                        type: 'text',
                        label: 'Duration',
                        contentEditable: true,
                    },
                    tag: { type: 'text', label: 'Tag', contentEditable: true },
                    href: { type: 'text', label: 'Link URL' },
                },
                getItemSummary: (item) => item.title || 'Destination',
            },
        } as ComponentConfig<DestinationsComponentProps>['fields'],
        defaultProps: {
            badge: 'Explore',
            header: 'Popular Destinations',
            description: 'Handpicked trips loved by our travelers',
            ...contentStyleDefaults,
            columns: 3,
            destinations: [
                {
                    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                    title: 'Bali Paradise',
                    location: 'Indonesia',
                    price: 'From $899',
                    duration: '7 days',
                    tag: 'Best Seller',
                    href: '/tours',
                },
                {
                    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                    title: 'Swiss Alps',
                    location: 'Switzerland',
                    price: 'From $1,299',
                    duration: '10 days',
                    tag: 'Adventure',
                    href: '/tours',
                },
                {
                    image: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                    title: 'Tokyo Discovery',
                    location: 'Japan',
                    price: 'From $1,099',
                    duration: '8 days',
                    tag: 'Culture',
                    href: '/tours',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            columns,
            destinations,
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
                <div
                    className={cn(
                        'grid gap-6',
                        columns === 2 && 'sm:grid-cols-2',
                        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
                        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
                    )}
                >
                    {destinations.map((dest, i) => (
                        <Card
                            key={i}
                            className="group overflow-hidden pt-0 transition hover:-translate-y-1 hover:shadow-xl"
                        >
                            <div className="relative">
                                {dest.image ? (
                                    <PuckImage
                                        src={dest.image}
                                        alt={dest.title}
                                        className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex aspect-[4/3] items-center justify-center bg-muted text-muted-foreground">
                                        No image
                                    </div>
                                )}
                                {dest.tag && (
                                    <Badge className="absolute top-3 left-3">
                                        {dest.tag}
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="space-y-3 p-5">
                                <h3 className="text-lg font-semibold text-foreground">
                                    {dest.title}
                                </h3>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <MapPinIcon className="size-3.5 text-primary" />
                                        {dest.location}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ClockIcon className="size-3.5 text-primary" />
                                        {dest.duration}
                                    </span>
                                </div>
                                <p className="text-lg font-bold text-primary">
                                    {dest.price}
                                </p>
                            </CardContent>
                            <CardFooter className="px-5 pb-5 pt-0">
                                {editMode ? (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        View Details
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        asChild
                                    >
                                        <Link href={dest.href}>
                                            View Details
                                        </Link>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </ContentSection>
        ),
    };
