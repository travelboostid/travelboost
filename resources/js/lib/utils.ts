import type { MediaResource } from '@/api/model';
import { DEFAULT_IMAGE } from '@/config';
import type { InertiaLinkProps } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function extractImageSrc(
    media: MediaResource,
    defaultImg: string = DEFAULT_IMAGE,
    variant: 'thumb' | 'small' | 'medium' | 'large' | 'original' = 'small',
    options?: { maxSrcSetWidth?: number },
) {
    const files = (media?.data?.files as any[]) || [];
    const maxSrcSetWidth = options?.maxSrcSetWidth;
    const src =
        files.find((f: any) => f.code === variant)?.url ||
        files.find((f: any) => f.code === 'medium')?.url ||
        files.find((f: any) => f.code === 'small')?.url ||
        defaultImg;
    const srcSet = files.length
        ? files
              .filter(
                  (f) =>
                      f.width &&
                      (!maxSrcSetWidth || Number(f.width) <= maxSrcSetWidth),
              )
              .map((f) => `${f.url} ${f.width}w`)
              .join(', ')
        : '';

    return { src, srcSet };
}

export function extractDocumentUrl(media: MediaResource) {
    const url = (media?.data as any)?.url;
    return url || '';
}

function resolveActiveLocale(preferredLocale?: string): string {
    if (preferredLocale) {
        return preferredLocale.toLowerCase().startsWith('id')
            ? 'id-ID'
            : 'en-US';
    }

    if (typeof window !== 'undefined') {
        const storedLocale = window.localStorage.getItem('locale-code');

        if (storedLocale) {
            return storedLocale.toLowerCase().startsWith('id')
                ? 'id-ID'
                : 'en-US';
        }
    }

    if (typeof document !== 'undefined' && document.documentElement.lang) {
        return document.documentElement.lang.toLowerCase().startsWith('id')
            ? 'id-ID'
            : 'en-US';
    }

    return 'id-ID';
}

export const formatIDR = (
    value: number,
    options?: {
        locale?: string;
        compactThreshold?: number;
    },
) => {
    const locale = resolveActiveLocale(options?.locale);
    const compactThreshold = options?.compactThreshold ?? 1_000_000;

    if (Math.abs(value) >= compactThreshold) {
        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            compactDisplay: 'short',
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 1,
        }).format(value);
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const formatIDRFull = (
    value: number,
    options?: {
        locale?: string;
    },
) => {
    return formatIDR(value, {
        ...options,
        compactThreshold: Number.POSITIVE_INFINITY,
    });
};

