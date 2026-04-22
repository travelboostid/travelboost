/* eslint-disable react-hooks/refs */
import { useCreateMedia } from '@/api/media/media';
import type { MediaResource, StoreMediaRequest } from '@/api/model';
import type { ChangeEvent, ReactElement } from 'react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import type { MediaUploaderTriggerProps, UploadProgressType } from './type';

type RawMediaUploaderProps = {
  accept?: string;
  afterUpload?: (data: MediaResource) => void;
  uploadParams?: Partial<StoreMediaRequest>;
  trigger: (
    props: MediaUploaderTriggerProps,
  ) => ReactElement<{ onClick?: React.MouseEventHandler }>;
};

export function RawMediaUploader({
  accept = '*/*',
  trigger,
  afterUpload,
  uploadParams = {} as StoreMediaRequest,
}: RawMediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressType>({});
  const uploader = useCreateMedia({
    request: {
      onUploadProgress: (p) =>
        setUploadProgress({
          percentage: p.percentage,
          rate: p.rate,
        }),
    },
  });

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploader.mutateAsync(
      {
        data: {
          ...uploadParams,
          data: file,
        } as StoreMediaRequest,
      },
      {
        onSuccess: (data) => {
          afterUpload?.(data);
        },
        onError: () => {
          toast.error('Failed to upload media. Please try again.');
          setUploadProgress({});
        },
      },
    );
  };

  const handleOpen = () => {
    fileInputRef.current!.value = '';
    fileInputRef.current!.click();
  };

  return (
    <>
      {trigger({
        progress: uploadProgress,
        status: uploader.status,
        open: handleOpen,
      })}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileChange}
      />
    </>
  );
}
