import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { ComponentConfig } from '@puckeditor/core';
import { CalendarIcon, UserIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type BlogPost = {
    image: string;
    title: string;
    excerpt: string;
    date: string;
    author: string;
    category: string;
    href: string;
};

export type BlogCardsComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    columns: 2 | 3;
    posts: BlogPost[];
};

export const BlogCardsComponentConfig: ComponentConfig<BlogCardsComponentProps> =
    {
        label: 'Blog / News Cards',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            columns: {
                type: 'select',
                label: 'Columns',
                options: [
                    { value: 2, label: '2 Columns' },
                    { value: 3, label: '3 Columns' },
                ],
            },
            posts: {
                type: 'array',
                label: 'Posts',
                max: 6,
                arrayFields: {
                    image: imageField('Cover Image'),
                    title: {
                        type: 'text',
                        label: 'Title',
                        contentEditable: true,
                    },
                    excerpt: {
                        type: 'textarea',
                        label: 'Excerpt',
                        contentEditable: true,
                    },
                    date: {
                        type: 'text',
                        label: 'Date',
                        contentEditable: true,
                    },
                    author: {
                        type: 'text',
                        label: 'Author',
                        contentEditable: true,
                    },
                    category: {
                        type: 'text',
                        label: 'Category',
                        contentEditable: true,
                    },
                    href: { type: 'text', label: 'Link URL' },
                },
                getItemSummary: (item) => item.title || 'Post',
            },
        } as ComponentConfig<BlogCardsComponentProps>['fields'],
        defaultProps: {
            badge: 'Travel Blog',
            header: 'Latest Stories & Tips',
            description:
                'Inspiration, guides, and insider knowledge for your next trip',
            ...contentStyleDefaults,
            columns: 3,
            posts: [
                {
                    image: '',
                    title: '10 Hidden Gems in Southeast Asia',
                    excerpt:
                        'Discover off-the-beaten-path destinations that most tourists never see.',
                    date: 'Mar 12, 2025',
                    author: 'Sarah Chen',
                    category: 'Guides',
                    href: '/tours',
                },
                {
                    image: '',
                    title: 'How to Pack Light for a 2-Week Trip',
                    excerpt:
                        'Expert packing tips to travel comfortably without overpacking.',
                    date: 'Mar 8, 2025',
                    author: 'Marco Rossi',
                    category: 'Tips',
                    href: '/tours',
                },
                {
                    image: '',
                    title: 'Best Time to Visit Japan',
                    excerpt:
                        'Season-by-season guide to planning your perfect Japanese adventure.',
                    date: 'Mar 1, 2025',
                    author: 'Aisha Patel',
                    category: 'Destinations',
                    href: '/tours',
                },
            ],
        },
        render: ({
            badge,
            header,
            description,
            columns,
            posts,
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
                        columns === 2
                            ? 'md:grid-cols-2'
                            : 'md:grid-cols-2 lg:grid-cols-3',
                    )}
                >
                    {posts.map((post, i) => (
                        <Card
                            key={i}
                            className="group overflow-hidden pt-0 transition hover:-translate-y-1 hover:shadow-lg"
                        >
                            {post.image ? (
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="aspect-video w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground">
                                    Cover image
                                </div>
                            )}
                            <CardContent className="space-y-3 p-5">
                                {post.category && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {post.category}
                                    </Badge>
                                )}
                                <h3 className="text-lg font-semibold leading-snug text-foreground">
                                    {post.title}
                                </h3>
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                    {post.excerpt}
                                </p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="size-3" />
                                        {post.date}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <UserIcon className="size-3" />
                                        {post.author}
                                    </span>
                                </div>
                                {editMode ? (
                                    <Button
                                        variant="link"
                                        className="h-auto p-0"
                                    >
                                        Read more →
                                    </Button>
                                ) : (
                                    <Button
                                        variant="link"
                                        className="h-auto p-0"
                                        asChild
                                    >
                                        <Link href={post.href}>
                                            Read more →
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </ContentSection>
        ),
    };
