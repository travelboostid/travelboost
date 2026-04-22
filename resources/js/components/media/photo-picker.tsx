import type { Media, MediaResource } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DEFAULT_PHOTO } from '@/config';
import { extractImageSrc } from '@/lib/utils';
import { CameraIcon, UploadCloudIcon } from 'lucide-react';
import { useState } from 'react';
import { ImageMediaUploader } from './image-media-uploader';
import { MediaSelector } from './media-selector';

type PhotoPickerProps = {
  onChange?: (data?: MediaResource | string | null) => void;
  value?: MediaResource | string | null;
  defaultValue?: MediaResource | Media | string | null;
  owner: { id: number; type: string };
};

export function PhotoPicker({
  value,
  defaultValue,
  onChange,
  owner,
}: PhotoPickerProps) {
  const [internalValue, setInternalValue] = useState<
    MediaResource | Media | string | null | undefined
  >(value || defaultValue);
  const [open, setOpen] = useState(false);

  const { src, srcSet } =
    typeof internalValue === 'string'
      ? { src: internalValue, srcSet: null }
      : extractImageSrc(internalValue as any, DEFAULT_PHOTO);

  const handleChange = (value?: MediaResource | string) => {
    setInternalValue(value);
    onChange?.(value);
  };

  const handleSelectedMedia = (media: MediaResource) => {
    setOpen(false);
    handleChange(media);
  };

  const handleAfterUpload = (data: MediaResource) => {
    setOpen(false);
    handleChange(data);
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <div className="flex flex-col items-center justify-items-center gap-2 cursor-pointer">
          <img
            className="aspect-square max-w-30 rounded-lg object-cover shadow"
            src={src}
            srcSet={srcSet || undefined}
          />
          <Button className="w-fit cursor-pointer" type="button">
            <CameraIcon />
            Change
          </Button>
        </div>
      </DialogTrigger>
      <DialogContent className="w-full max-w-200">
        <ImageMediaUploader
          afterUpload={handleAfterUpload}
          aspect={1}
          uploadParams={{
            owner_type: owner.type,
            owner_id: owner.id,
            type: 'image',
            subtype: 'photo',
          }}
          trigger={({ open }) => (
            <button
              type="button"
              className="cursor-pointer rounded-md border-2 border-dashed p-4 text-center"
              onClick={open}
            >
              <UploadCloudIcon
                size={48}
                className="mx-auto text-muted-foreground"
              />
              <h1 className="mb-2 font-medium">Click Here to Upload</h1>
              <p className="mb-4 text-sm text-muted-foreground">
                Choose an image file from your device to upload as your new
                avatar.
              </p>
            </button>
          )}
        ></ImageMediaUploader>
        <MediaSelector
          display="grid"
          params={{
            owner_type: owner.type,
            owner_id: owner.id,
            type: 'image',
            subtype: 'photo',
          }}
          onChange={handleSelectedMedia}
        />
        <DialogFooter>
          <DialogClose>
            <Button type="button">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
