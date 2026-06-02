/* eslint-disable react-hooks/refs */
import { useCreateMedia } from '@/api/media/media';
import type { MediaResource, StoreMediaRequest } from '@/api/model';
import { Slider } from '@/components/ui/slider';
import { RotateCwIcon, ZoomInIcon } from 'lucide-react';
import type { ChangeEvent, ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import type { MediaUploaderTriggerProps, UploadProgressType } from './type';
import { getCroppedImg } from './utils';

type ImageMediaUploaderProps = {
    aspect?: number;
    accept?: string;
    afterUpload?: (data: MediaResource) => void;
    onUploadStateChange?: (
        state: 'idle' | 'pending' | 'success' | 'error',
    ) => void;
    uploadParams?: Partial<StoreMediaRequest>;
    trigger: (
        props: MediaUploaderTriggerProps,
    ) => ReactElement<{ onClick?: React.MouseEventHandler }>;
};

function resolveMediaResource(data: unknown): MediaResource {
    if (
        data &&
        typeof data === 'object' &&
        'data' in data &&
        (data as { data?: MediaResource }).data?.id
    ) {
        return (data as { data: MediaResource }).data;
    }

    return data as MediaResource;
}

export function ImageMediaUploader({
    aspect = 1,
    accept = 'image/*',
    afterUpload,
    uploadParams = {} as StoreMediaRequest,
    trigger,
}: ImageMediaUploaderProps) {
    const [uploadProgress, setUploadProgress] = useState<UploadProgressType>(
        {},
    );
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [file, setFile] = useState<File | null>(null);
    const image = useMemo(() => {
        if (!file) return '';
        return URL.createObjectURL(file);
    }, [file]);

    const [open, setOpen] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null,
    );

    const uploader = useCreateMedia({
        request: {
            onUploadProgress: (p) =>
                setUploadProgress({
                    percentage: p.progress
                        ? Math.round(p.progress * 100)
                        : undefined,
                    rate: p.rate,
                }),
        },
    });

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Only image files are allowed');
            e.target.value = '';
            return;
        }
        setFile(file);
        setOpen(true);
    };

    const handleCropAndUpload = async () => {
        try {
            const croppedImage = await getCroppedImg(
                image,
                croppedAreaPixels!,
                rotation,
            );

            await uploader.mutateAsync(
                {
                    data: {
                        ...uploadParams,
                        name: file!.name,
                        data: croppedImage!,
                    } as StoreMediaRequest,
                },
                {
                    onSuccess: (data) => {
                        setFile(null);
                        setOpen(false);
                        afterUpload?.(resolveMediaResource(data));
                    },
                },
            );
        } catch (e) {
            console.error(e);
            toast.error('Failed to upload image. Please try again.');
            setUploadProgress({});
        }
    };

    useEffect(() => {
        if (open) {
            setCrop({ x: 0, y: 0 });
            setRotation(0);
            setZoom(1);
            setCroppedAreaPixels(null);
        } else {
            setFile(null);
        }
    }, [open]);

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
            <AlertDialog onOpenChange={setOpen} open={open}>
                <AlertDialogContent className="w-full max-w-200">
                    <div className="grid gap-4">
                        <div className="relative h-50 w-full">
                            <Cropper
                                image={image}
                                crop={crop}
                                rotation={rotation}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onRotationChange={setRotation}
                                onCropComplete={(_, croppedAreaPixels) =>
                                    setCroppedAreaPixels(croppedAreaPixels)
                                }
                                onZoomChange={setZoom}
                            />
                        </div>
                        <div className="grid gap-4">
                            <div className="flex gap-2">
                                <ZoomInIcon className="w-4 h-4" />
                                <Slider
                                    defaultValue={[1]}
                                    min={1}
                                    max={100}
                                    step={1}
                                    value={[zoom]}
                                    onValueChange={(v) => setZoom(v[0])}
                                />
                            </div>
                            <div className="flex gap-2">
                                <RotateCwIcon className="w-4 h-4" />
                                <Slider
                                    defaultValue={[0]}
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={[rotation]}
                                    onValueChange={(v) => setRotation(v[0])}
                                />
                            </div>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            type="button"
                            disabled={uploader.isPending}
                        >
                            Cancel
                        </AlertDialogCancel>
                        <Button
                            type="button"
                            disabled={uploader.isPending}
                            onClick={handleCropAndUpload}
                        >
                            Upload{' '}
                            {uploadProgress.percentage
                                ? `(${uploadProgress.percentage}%)`
                                : ''}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
