import { getMedias } from '@/api/media/media';
import type { GetMediasParams, MediaResource } from '@/api/model';
import { cn } from '@/lib/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FileIcon } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { Button } from './ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from './ui/item';

type MediaSelectorProps = {
  type?: 'image' | 'photo' | 'document';
  value?: MediaResource | null;
  params?: GetMediasParams;
  onChange?: (media: MediaResource) => void;
};
export function MediaSelector({
  type = 'photo',
  params,
  value,
  onChange,
}: MediaSelectorProps) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryFn: ({ pageParam }) =>
        getMedias({ ...params, type, page: pageParam }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        const { current_page, last_page } = lastPage.meta || {};
        return (current_page || 0) < (last_page || 0)
          ? (current_page || 0) + 1
          : undefined;
      },
      getPreviousPageParam: (firstPage) =>
        firstPage.meta.current_page || 0
          ? (firstPage.meta.current_page || 0) - 1
          : undefined,
      queryKey: ['medias', type],
    });
  const { ref, inView } = useInView({
    rootMargin: '200px',
    triggerOnce: false,
  });
  const medias = useMemo(() => {
    return data?.pages.flatMap((page) => page.data) ?? [];
  }, [data]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <div
        className={`grid ${type === 'document' ? 'grid-cols-1' : 'grid-cols-3'} gap-4`}
      >
        {medias.map((media) => (
          <MediaCard
            key={media?.id}
            media={media!}
            selected={value?.id === media?.id}
            onClick={() => onChange?.(media!)}
          />
        ))}
      </div>

      {/* sentinel */}
      <div ref={ref} className="h-1" />

      {isFetchingNextPage && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Loading more…
        </div>
      )}
    </>
  );
}

type ImageMediaCardProps = {
  media: MediaResource;
  selected?: boolean;
  onClick?: () => void;
};

function ImageMediaCard({ media, selected, onClick }: ImageMediaCardProps) {
  const mediaData = media.data as Record<string, any>;
  const src =
    (mediaData.files || []).find((f: any) => f.code == 'medium')?.url || '';
  const srcSet = (mediaData.files || [])
    .filter((f: any) => f.width)
    .map((f: any) => `${f.url} ${f.width}w`)
    .join(', ');

  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border text-left transition',
        selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40',
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

type PhotoMediaCardProps = {
  media: MediaResource;
  selected?: boolean;
  onClick?: () => void;
};

function PhotoMediaCard({ media, selected, onClick }: PhotoMediaCardProps) {
  const mediaData = media.data as Record<string, any>;

  const src = mediaData.files?.[0]?.url ?? '';
  const srcSet = (mediaData.files ?? [])
    .filter((f: any) => f.width)
    .map((f: any) => `${f.url} ${f.width}w`)
    .join(', ');

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

type DocumentMediaCardProps = {
  media: MediaResource;
  selected?: boolean;
  onClick?: () => void;
};
function DocumentMediaCard({
  media,
  selected,
  onClick,
}: DocumentMediaCardProps) {
  // const mediaData = media.data as DocumentMediaData;
  return (
    <Item
      variant="outline"
      size="sm"
      className={
        selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40'
      }
    >
      <ItemMedia>
        <FileIcon className="size-5" />
      </ItemMedia>
      <ItemContent className="">
        <ItemTitle>{media.name}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button onClick={onClick}>Select</Button>
      </ItemActions>
    </Item>
  );
  return (
    <div
      className={cn(
        'group overflow-hidden rounded-lg border text-left transition',
        selected ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary/40',
      )}
      onClick={onClick}
    >
      <div className="truncate text-xs">{media.name}</div>
    </div>
  );
}

export function MediaCard({
  media,
  selected,
  onClick,
}: {
  media: MediaResource;
  selected?: boolean;
  onClick?: () => void;
}) {
  if (media.type === 'document') {
    return (
      <DocumentMediaCard media={media} selected={selected} onClick={onClick} />
    );
  } else if (media.type === 'photo') {
    return (
      <PhotoMediaCard media={media} selected={selected} onClick={onClick} />
    );
  }

  return <ImageMediaCard media={media} selected={selected} onClick={onClick} />;
}
