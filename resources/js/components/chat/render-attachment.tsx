import { useGetTour } from '@/api/tour/tour';
import { extractImageSrc } from '@/lib/utils';
import { IconImageInPicture } from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Spinner } from '../ui/spinner';

function TourAttachment({ id }: { id: number }) {
  const { isLoading, data } = useGetTour(id);
  return (
    <div>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="flex gap-2 items-center">
          <div>
            <Avatar className="rounded-md">
              <AvatarImage
                src={extractImageSrc(data?.data.image as any).src}
                alt={data?.data.name || 'Tour thumbnail'}
              />
              <AvatarFallback>
                <IconImageInPicture className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <div className="text-sm line-clamp-1">{data?.data.name}</div>
            <div className="text-xs opacity-80">{data?.data.country_name}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function InvalidAttachment({ type }: { type: string }) {
  return <div>Invalid attachment type: {type}</div>;
}

export default function RenderAttachment({
  type,
  data,
}: {
  type: string;
  data: string;
}) {
  if (type === 'tour') {
    return <TourAttachment id={+data} />;
  }
  return <InvalidAttachment type={type} />;
}
