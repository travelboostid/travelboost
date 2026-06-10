import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type CollageImage = {
    image: string;
    alt: string;
    size: 'sm' | 'md' | 'lg';
};

export type ImageCollageComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    images: CollageImage[];
};

const sizeClasses = {
    sm: 'col-span-1 row-span-1',
    md: 'col-span-1 row-span-2 md:col-span-1',
    lg: 'col-span-2 row-span-2',
};

const rotations = [
    '-rotate-2',
    'rotate-1',
    '-rotate-1',
    'rotate-2',
    '-rotate-3',
];

export const ImageCollageComponentConfig: ComponentConfig<ImageCollageComponentProps> =
    {
        label: 'Image Collage',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            images: {
                type: 'array',
                label: 'Images',
                max: 6,
                arrayFields: {
                    image: imageField('Image'),
                    alt: { type: 'text', label: 'Alt Text' },
                    size: {
                        type: 'select',
                        label: 'Size',
                        options: [
                            { value: 'sm', label: 'Small' },
                            { value: 'md', label: 'Medium' },
                            { value: 'lg', label: 'Large' },
                        ],
                    },
                },
                getItemSummary: (item) => item.alt || 'Image',
            },
        } as ComponentConfig<ImageCollageComponentProps>['fields'],
        defaultProps: {
            badge: 'Gallery',
            header: 'Moments That Inspire',
            description: 'A visual journey through unforgettable destinations',
            ...contentStyleDefaults,
            background: 'muted',
            images: [
                { image: '', alt: 'Beach sunset', size: 'lg' },
                { image: '', alt: 'Mountain peak', size: 'md' },
                { image: '', alt: 'City skyline', size: 'sm' },
                { image: '', alt: 'Local market', size: 'sm' },
                { image: '', alt: 'Temple visit', size: 'md' },
            ],
        },
        render: ({
            badge,
            header,
            description,
            images,
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
            >
                <div className="grid auto-rows-[120px] grid-cols-2 gap-3 md:auto-rows-[140px] md:grid-cols-4 md:gap-4">
                    {images.map((item, i) => (
                        <div
                            key={i}
                            className={cn(
                                'group overflow-hidden rounded-2xl shadow-lg ring-1 ring-border/40 transition duration-300 hover:z-10 hover:scale-[1.02] hover:shadow-2xl',
                                sizeClasses[item.size],
                                rotations[i % rotations.length],
                            )}
                        >
                            {item.image ? (
                                <img
                                    src={item.image}
                                    alt={item.alt}
                                    className="size-full object-cover transition duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="flex size-full items-center justify-center bg-muted text-sm text-muted-foreground">
                                    Image {i + 1}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ContentSection>
        ),
    };
