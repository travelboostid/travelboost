import type { MediaResource } from '@/api/model';
import { DEFAULT_IMAGE } from '@/config';
import { extractImageSrc } from '@/lib/utils';

export const TOUR_CARD_MAX_SRC_WIDTH = 720;

export const TOUR_CARD_IMAGE_SIZES =
    '(max-width: 768px) min(100vw - 3rem, 480px), (max-width: 1280px) 45vw, 280px';

type TourMediaImageProps = Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet'
> & {
    media?: MediaResource | null;
    fallbackSrc?: string;
    variant?: 'thumb' | 'small' | 'medium' | 'large' | 'original';
    priority?: boolean;
};

export function TourMediaImage({
    media,
    fallbackSrc = DEFAULT_IMAGE,
    variant,
    priority = false,
    alt = '',
    ...props
}: TourMediaImageProps) {
    const resolvedVariant =
        variant ?? (priority ? 'medium' : ('small' as const));
    const { src, srcSet } = extractImageSrc(
        (media ?? {}) as MediaResource,
        fallbackSrc,
        resolvedVariant,
        { maxSrcSetWidth: TOUR_CARD_MAX_SRC_WIDTH },
    );

    return <img src={src} srcSet={srcSet || undefined} alt={alt} {...props} />;
}
