import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { extractImageSrc } from '@/lib/utils';

type ImagePickerProps = {
  name: string;
  value: string;
  onChange: (value: string) => void;
};

export default function ImagePicker({
  name,
  value,
  onChange,
}: ImagePickerProps) {
  const { company } = usePageSharedDataProps();
  return (
    <MediaPicker
      params={{ owner_type: 'company', owner_id: company.id }}
      uploadParams={{ owner_type: 'company', owner_id: company.id }}
      type="image"
      value={value}
      onChange={(v) =>
        onChange(typeof v === 'string' ? v : extractImageSrc(v as any).src)
      }
    >
      {(media, change) => (
        <div className="flex flex-col items-center justify-items-center gap-2">
          <img
            className="aspect-video max-w-90 rounded object-cover shadow"
            src={
              typeof media === 'string'
                ? media
                : extractImageSrc(media as any).src
            }
          />
          <input type="hidden" name={name} value={(media as any)?.id} />
          <Button className="w-fit" onClick={change} type="button">
            Change
          </Button>
        </div>
      )}
    </MediaPicker>
  );
}
