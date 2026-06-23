import { cn } from '@/lib/utils';
import type { ImgHTMLAttributes } from 'react';

type OptimizedImageProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'width' | 'height'
> & {
    src: string;
    alt: string;
    width: number;
    height: number;
    priority?: boolean;
    webpSrc?: string;
};

function toWebpSrc(src: string): string {
    return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

export function OptimizedImage({
    src,
    alt,
    width,
    height,
    priority = false,
    webpSrc,
    className,
    ...props
}: OptimizedImageProps) {
    const resolvedWebpSrc = webpSrc ?? toWebpSrc(src);

    return (
        <picture>
            <source srcSet={resolvedWebpSrc} type="image/webp" />
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                decoding={priority ? 'sync' : 'async'}
                loading={priority ? 'eager' : 'lazy'}
                fetchPriority={priority ? 'high' : 'auto'}
                className={cn(className)}
                {...props}
            />
        </picture>
    );
}
