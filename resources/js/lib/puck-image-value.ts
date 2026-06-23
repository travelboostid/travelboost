import type { MediaResource } from '@/api/model';
import { extractImageSrc } from '@/lib/utils';

export type PuckImageStoredValue = {
    mediaId: string;
    src: string;
    srcSet: string;
};

export type ImageVariant = 'thumb' | 'small' | 'medium' | 'large' | 'original';

export function serializePuckImageValue(
    media: MediaResource,
    variant: ImageVariant = 'small',
): string {
    const { src, srcSet } = extractImageSrc(media, undefined, variant);

    if (!media?.id) {
        return src;
    }

    const payload: PuckImageStoredValue = {
        mediaId: String(media.id),
        src,
        srcSet,
    };

    return JSON.stringify(payload);
}

export function parsePuckImageValue(value?: string | null): {
    src: string;
    srcSet?: string;
    mediaId?: string;
} {
    if (!value) {
        return { src: '' };
    }

    const trimmed = value.trim();

    if (!trimmed.startsWith('{')) {
        return { src: trimmed };
    }

    try {
        const parsed = JSON.parse(trimmed) as Partial<PuckImageStoredValue>;

        return {
            src: parsed.src ?? '',
            srcSet: parsed.srcSet || undefined,
            mediaId: parsed.mediaId,
        };
    } catch {
        return { src: value };
    }
}

export function puckImagePreviewSrc(value?: string | null): string {
    return parsePuckImageValue(value).src;
}
