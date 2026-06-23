import { parsePuckImageValue } from '@/lib/puck-image-value';
import { cn } from '@/lib/utils';
import type { ImgHTMLAttributes } from 'react';

type PuckImageProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'srcSet'
> & {
    src: string;
    alt: string;
    priority?: boolean;
    srcSet?: string;
    sizes?: string;
};

function toWebpSrc(src: string): string {
    return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

function isWebpSrc(src: string): boolean {
    return /\.webp($|\?)/i.test(src);
}

export function PuckImage({
    src,
    alt,
    priority = false,
    srcSet: srcSetProp,
    sizes,
    className,
    ...props
}: PuckImageProps) {
    const resolved = parsePuckImageValue(src);
    const finalSrc = resolved.src || src;
    const finalSrcSet = srcSetProp ?? resolved.srcSet;
    const finalSizes = sizes ?? (priority && finalSrcSet ? '100vw' : undefined);

    const imgProps = {
        alt,
        src: finalSrc,
        srcSet: finalSrcSet || undefined,
        sizes: finalSizes || undefined,
        loading: priority ? ('eager' as const) : ('lazy' as const),
        decoding: priority ? ('sync' as const) : ('async' as const),
        fetchPriority: priority ? ('high' as const) : ('auto' as const),
        className: cn(className),
        ...props,
    };

    if (isWebpSrc(finalSrc) || finalSrcSet) {
        return <img {...imgProps} />;
    }

    return (
        <picture>
            <source srcSet={toWebpSrc(finalSrc)} type="image/webp" />
            <img {...imgProps} />
        </picture>
    );
}
