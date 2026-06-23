import type { MediaResource } from '@/api/model';
import { DEFAULT_IMAGE } from '@/config';
import { extractImageSrc } from '@/lib/utils';

export const TOUR_CARD_IMAGE_SIZES =
    '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw';

type TourMediaImageProps = Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet'
> & {
    media?: MediaResource | null;
    fallbackSrc?: string;
    variant?: 'thumb' | 'small' | 'medium' | 'large' | 'original';
};

export function TourMediaImage({
    media,
    fallbackSrc = DEFAULT_IMAGE,
    variant = 'medium',
    alt = '',
    ...props
}: TourMediaImageProps) {
    const { src, srcSet } = extractImageSrc(
        (media ?? {}) as MediaResource,
        fallbackSrc,
        variant,
    );

    return <img src={src} srcSet={srcSet || undefined} alt={alt} {...props} />;
}
