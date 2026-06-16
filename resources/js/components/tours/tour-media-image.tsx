import type { MediaResource } from '@/api/model';
import { DEFAULT_IMAGE } from '@/config';
import { extractImageSrc } from '@/lib/utils';

type TourMediaImageProps = Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet'
> & {
    media?: MediaResource | null;
    fallbackSrc?: string;
};

export function TourMediaImage({
    media,
    fallbackSrc = DEFAULT_IMAGE,
    alt = '',
    ...props
}: TourMediaImageProps) {
    const { src, srcSet } = extractImageSrc(
        (media ?? {}) as MediaResource,
        fallbackSrc,
    );

    return <img src={src} srcSet={srcSet || undefined} alt={alt} {...props} />;
}
