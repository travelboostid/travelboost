import type { MediaResource } from '@/api/model';
import { DEFAULT_IMAGE } from '@/config';
import { cn, extractImageSrc } from '@/lib/utils';

export type ImageMediaCardProps = {
    media: MediaResource;
    selected?: boolean;
    onClick?: () => void;
};

export default function ImageMediaCard({
    media,
    selected,
    onClick,
}: ImageMediaCardProps) {
    const { src, srcSet } = extractImageSrc(media, DEFAULT_IMAGE);

    return (
        <div
            className={cn(
                'group overflow-hidden rounded-lg border text-left transition',
                selected
                    ? 'ring-2 ring-primary'
                    : 'hover:ring-2 hover:ring-primary/40',
            )}
            onClick={onClick}
        >
            <img
                src={src}
                srcSet={srcSet}
                className="w-full object-cover"
                alt="Image"
            />
        </div>
    );
}
