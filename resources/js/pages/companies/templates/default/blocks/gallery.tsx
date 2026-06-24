import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { ImageIcon } from 'lucide-react';
import { imageField } from '../../components/fields';
import { PuckImage } from '../../components/puck-image';
import {
    SectionHeader,
    columnGridClass,
    sectionContainerClass,
    sectionHeaderFields,
    sectionInnerClass,
    sectionStyleDefaults,
    sectionStyleFields,
    type SectionAlign,
    type SectionBackground,
    type SectionMaxWidth,
    type SectionPadding,
} from '../../components/section-styles';

export type GalleryLayout = 'grid' | 'masonry';
export type GalleryAspect = 'square' | 'video' | 'portrait';
export type GalleryHover = 'none' | 'zoom' | 'overlay';

export type GalleryComponentProps = {
    badge: string;
    header: string;
    description: string;
    columns: 2 | 3 | 4;
    layout: GalleryLayout;
    aspect: GalleryAspect;
    hover: GalleryHover;
    gap: 'sm' | 'md' | 'lg';
    rounded: 'md' | 'lg' | 'xl' | '2xl';
    showCaptions: boolean;
    padding: SectionPadding;
    align: SectionAlign;
    background: SectionBackground;
    maxWidth: SectionMaxWidth;
    images: { url: string; caption: string }[];
};

const aspectClasses: Record<GalleryAspect, string> = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
};

const gapClasses = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' };
const roundedClasses = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
};

export const GalleryComponentConfig: ComponentConfig<GalleryComponentProps> = {
    label: 'Gallery',
    fields: {
        ...sectionHeaderFields(),
        ...sectionStyleFields,
        columns: {
            type: 'select',
            label: 'Columns',
            options: [
                { value: 2, label: '2 Columns' },
                { value: 3, label: '3 Columns' },
                { value: 4, label: '4 Columns' },
            ],
        },
        layout: {
            type: 'select',
            label: 'Layout',
            options: [
                { value: 'grid', label: 'Even Grid' },
                { value: 'masonry', label: 'Staggered' },
            ],
        },
        aspect: {
            type: 'select',
            label: 'Image Aspect',
            options: [
                { value: 'square', label: 'Square (1:1)' },
                { value: 'video', label: 'Landscape (16:9)' },
                { value: 'portrait', label: 'Portrait (3:4)' },
            ],
        },
        hover: {
            type: 'select',
            label: 'Hover Effect',
            options: [
                { value: 'none', label: 'None' },
                { value: 'zoom', label: 'Zoom' },
                { value: 'overlay', label: 'Caption Overlay' },
            ],
        },
        gap: {
            type: 'select',
            label: 'Gap Size',
            options: [
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
            ],
        },
        rounded: {
            type: 'select',
            label: 'Corner Radius',
            options: [
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'Extra Large' },
                { value: '2xl', label: '2XL' },
            ],
        },
        showCaptions: {
            type: 'radio',
            label: 'Show Captions Below',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
        images: {
            type: 'array',
            label: 'Images',
            max: 12,
            arrayFields: {
                url: imageField('Image'),
                caption: {
                    type: 'text',
                    label: 'Caption',
                    contentEditable: true,
                },
            },
            getItemSummary: (item) => item.caption || 'Image',
        },
    },
    defaultProps: {
        badge: 'Gallery',
        header: 'Photo Gallery',
        description: 'Explore stunning destinations captured by our travelers',
        ...sectionStyleDefaults,
        columns: 3,
        layout: 'grid',
        aspect: 'square',
        hover: 'overlay',
        gap: 'md',
        rounded: 'xl',
        showCaptions: true,
        images: [
            {
                url: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                caption: 'Mountain Adventure',
            },
            {
                url: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                caption: 'Coastal Escape',
            },
            {
                url: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                caption: 'City Discovery',
            },
            {
                url: 'https://cdn.shadcnstudio.com/ss-assets/components/card/image-7.png?width=368&format=auto',
                caption: 'Desert Journey',
            },
        ],
    },
    render: ({
        badge,
        header,
        description,
        columns,
        layout,
        aspect,
        hover,
        gap,
        rounded,
        showCaptions,
        padding,
        align,
        background,
        maxWidth,
        images,
    }) => (
        <section className={sectionContainerClass({ padding, background })}>
            <div className={sectionInnerClass(maxWidth)}>
                <SectionHeader
                    badge={badge}
                    header={header}
                    description={description}
                    align={align}
                    inverted={background === 'primary'}
                />
                <div
                    className={cn(
                        columnGridClass(columns),
                        gapClasses[gap],
                        layout === 'masonry' &&
                            'auto-rows-[minmax(180px,auto)]',
                    )}
                >
                    {images.map((image, i) => (
                        <figure
                            key={i}
                            className={cn(
                                'group relative overflow-hidden',
                                roundedClasses[rounded],
                                layout === 'masonry' &&
                                    i % 3 === 1 &&
                                    'sm:row-span-2',
                            )}
                        >
                            {image.url ? (
                                <>
                                    <PuckImage
                                        src={image.url}
                                        alt={image.caption}
                                        className={cn(
                                            'w-full object-cover transition duration-500',
                                            aspectClasses[aspect],
                                            hover === 'zoom' &&
                                                'group-hover:scale-110',
                                            hover === 'overlay' &&
                                                'group-hover:scale-105',
                                        )}
                                    />
                                    {hover === 'overlay' && image.caption && (
                                        <figcaption className="absolute inset-0 flex items-end bg-linear-to-t from-black/70 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                            <span className="text-sm font-medium text-white">
                                                {image.caption}
                                            </span>
                                        </figcaption>
                                    )}
                                </>
                            ) : (
                                <div
                                    className={cn(
                                        'flex w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground',
                                        aspectClasses[aspect],
                                    )}
                                >
                                    <ImageIcon className="size-8 opacity-40" />
                                    <span className="text-sm">Add image</span>
                                </div>
                            )}
                            {showCaptions &&
                                hover !== 'overlay' &&
                                image.caption && (
                                    <figcaption className="mt-3 text-sm font-medium text-muted-foreground">
                                        {image.caption}
                                    </figcaption>
                                )}
                        </figure>
                    ))}
                </div>
            </div>
        </section>
    ),
};
