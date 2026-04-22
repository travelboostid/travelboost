import type { MediaResource } from '@/api/model';
import { DEFAULT_PHOTO } from '@/config';
import { cn, extractImageSrc } from '@/lib/utils';

type PhotoMediaCardProps = {
  media: MediaResource;
  selected?: boolean;
  onClick?: () => void;
};

export default function PhotoMediaCard({
  media,
  selected,
  onClick,
}: PhotoMediaCardProps) {
  const { src, srcSet } = extractImageSrc(media, DEFAULT_PHOTO);

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border text-left transition',
        selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40',
      )}
      onClick={onClick}
    >
      {/* 1:1 container */}
      <div className="relative aspect-square w-full">
        <img
          src={src}
          srcSet={srcSet}
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 200px"
          alt={media.name || 'Photo'}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    </div>
  );
}
