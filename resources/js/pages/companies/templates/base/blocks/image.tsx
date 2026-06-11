import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { ImageIcon } from 'lucide-react';
import { imageField } from '../../components/fields';

export type ImageComponentProps = {
    imageUrl: string;
    alt: string;
    caption: string;
    rounded: 'none' | 'md' | 'lg' | 'xl' | 'full';
    aspectRatio: 'auto' | 'video' | 'square' | 'wide' | 'portrait';
    objectFit: 'cover' | 'contain';
    shadow: 'none' | 'sm' | 'md' | 'lg';
    ring: boolean;
    fullWidth: boolean;
};

const roundedClasses: Record<ImageComponentProps['rounded'], string> = {
    none: 'rounded-none',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
};

const aspectClasses: Record<ImageComponentProps['aspectRatio'], string> = {
    auto: '',
    video: 'aspect-video',
    square: 'aspect-square',
    wide: 'aspect-[21/9]',
    portrait: 'aspect-[3/4]',
};

const shadowClasses: Record<ImageComponentProps['shadow'], string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-xl',
};

export const ImageComponentConfig: ComponentConfig<ImageComponentProps> = {
    label: 'Image',
    fields: {
        imageUrl: imageField('Image'),
        alt: { type: 'text', label: 'Alt Text' },
        caption: {
            type: 'text',
            label: 'Caption',
            contentEditable: true,
        },
        rounded: {
            type: 'select',
            label: 'Rounded Corners',
            options: [
                { value: 'none', label: 'None' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'Extra Large' },
                { value: 'full', label: 'Circle' },
            ],
        },
        aspectRatio: {
            type: 'select',
            label: 'Aspect Ratio',
            options: [
                { value: 'auto', label: 'Auto' },
                { value: 'video', label: '16:9 Landscape' },
                { value: 'square', label: '1:1 Square' },
                { value: 'wide', label: '21:9 Ultra Wide' },
                { value: 'portrait', label: '3:4 Portrait' },
            ],
        },
        objectFit: {
            type: 'select',
            label: 'Object Fit',
            options: [
                { value: 'cover', label: 'Cover (crop)' },
                { value: 'contain', label: 'Contain (fit)' },
            ],
        },
        shadow: {
            type: 'select',
            label: 'Shadow',
            options: [
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
            ],
        },
        ring: {
            type: 'radio',
            label: 'Border Ring',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
        fullWidth: {
            type: 'radio',
            label: 'Full Width',
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
            ],
        },
    },
    defaultProps: {
        imageUrl: '',
        alt: 'Image',
        caption: '',
        rounded: 'xl',
        aspectRatio: 'video',
        objectFit: 'cover',
        shadow: 'md',
        ring: false,
        fullWidth: true,
    },
    render: ({
        imageUrl,
        alt,
        caption,
        rounded,
        aspectRatio,
        objectFit,
        shadow,
        ring,
        fullWidth,
    }) => {
        const imageClasses = cn(
            fullWidth ? 'w-full' : 'mx-auto max-w-2xl',
            `object-${objectFit}`,
            roundedClasses[rounded],
            aspectClasses[aspectRatio],
            shadowClasses[shadow],
            ring && 'ring-1 ring-border',
        );

        return (
            <figure className={cn(!fullWidth && 'flex flex-col items-center')}>
                {imageUrl ? (
                    <img src={imageUrl} alt={alt} className={imageClasses} />
                ) : (
                    <div
                        className={cn(
                            'flex flex-col items-center justify-center gap-3 bg-muted/80 text-muted-foreground',
                            imageClasses,
                            aspectRatio === 'auto' && 'min-h-52 w-full',
                        )}
                    >
                        <ImageIcon className="size-10 opacity-30" />
                        <span className="text-sm">Click to add an image</span>
                    </div>
                )}
                {caption && (
                    <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                        {caption}
                    </figcaption>
                )}
            </figure>
        );
    },
};
