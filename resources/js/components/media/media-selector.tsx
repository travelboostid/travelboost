import { getMedias } from '@/api/media/media';
import type { GetMediasParams, MediaResource } from '@/api/model';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { EmptyUploads } from './empty-uploads';
import { MediaCard } from './media-card';

type MediaSelectorProps = {
  display: 'grid' | 'list';
  value?: MediaResource | null;
  params?: GetMediasParams;
  onChange?: (media: MediaResource) => void;
};
export function MediaSelector({
  display = 'grid',
  params,
  value,
  onChange,
}: MediaSelectorProps) {
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryFn: ({ pageParam }) => getMedias({ ...params, page: pageParam }),
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
      queryKey: ['medias', params],
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

  const displayClassName =
    display === 'grid' ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-1 gap-2';

  if (medias.length === 0) return null;
  return (
    <div className="max-h-75 overflow-y-auto border rounded-md p-2 space-y-3">
      <div className="font- text-muted-foreground">Recent uploads</div>
      <div className={`${displayClassName} gap-4`}>
        {medias.length === 0 && <EmptyUploads />}
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
    </div>
  );
}
