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
) {
  const files = (media?.data?.files as any[]) || [];
  const src = files.find((f: any) => f.code === 'small')?.url || defaultImg;
  const srcSet = files.length
    ? files
        .filter((f) => f.width)
        .map((f) => `${f.url} ${f.width}w`)
        .join(', ')
    : '';
  return { src, srcSet };
}

export function extractDocumentUrl(media: MediaResource) {
  const url = (media?.data as any)?.url;
  return url || '';
}
