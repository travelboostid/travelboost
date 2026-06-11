import { cn } from '@/lib/utils';
import type { ComponentConfig } from '@puckeditor/core';
import { PlayIcon } from 'lucide-react';
import {
    ContentSection,
    contentHeaderFields,
    contentStyleDefaults,
    contentStyleFields,
    type ContentStyleProps,
} from '../../components/content-shared';
import { imageField } from '../../components/fields';

export type VideoSectionComponentProps = ContentStyleProps & {
    badge: string;
    header: string;
    description: string;
    videoUrl: string;
    posterUrl: string;
    aspect: 'video' | 'wide';
};

function getEmbedUrl(url: string): string | null {
    if (!url) {
        return null;
    }

    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/,
    );
    if (ytMatch) {
        return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    if (url.includes('vimeo.com')) {
        const vimeoId = url.split('/').pop();
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    }

    return url.includes('embed') ? url : null;
}

export const VideoSectionComponentConfig: ComponentConfig<VideoSectionComponentProps> =
    {
        label: 'Video Section',
        fields: {
            ...contentHeaderFields(),
            ...contentStyleFields,
            videoUrl: { type: 'text', label: 'Video URL (YouTube / Vimeo)' },
            posterUrl: imageField('Poster Image (optional)'),
            aspect: {
                type: 'select',
                label: 'Aspect Ratio',
                options: [
                    { value: 'video', label: '16:9' },
                    { value: 'wide', label: '21:9 Cinematic' },
                ],
            },
        } as ComponentConfig<VideoSectionComponentProps>['fields'],
        defaultProps: {
            badge: 'Watch',
            header: 'See the World Through Our Lens',
            description: 'A glimpse into the adventures waiting for you',
            ...contentStyleDefaults,
            videoUrl: '',
            posterUrl: '',
            aspect: 'video',
        },
        render: ({
            badge,
            header,
            description,
            videoUrl,
            posterUrl,
            aspect,
            padding,
            align,
            background,
            maxWidth,
        }) => {
            const embedUrl = getEmbedUrl(videoUrl);

            return (
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
                            'relative overflow-hidden rounded-2xl bg-muted shadow-xl',
                            aspect === 'video'
                                ? 'aspect-video'
                                : 'aspect-[21/9]',
                        )}
                    >
                        {embedUrl ? (
                            <iframe
                                src={embedUrl}
                                title={header}
                                className="absolute inset-0 size-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : posterUrl ? (
                            <div className="relative size-full">
                                <img
                                    src={posterUrl}
                                    alt={header}
                                    className="size-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                    <div className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                                        <PlayIcon className="size-7 fill-current" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                                <PlayIcon className="size-12 opacity-30" />
                                <span className="text-sm">Add a video URL</span>
                            </div>
                        )}
                    </div>
                </ContentSection>
            );
        },
    };
