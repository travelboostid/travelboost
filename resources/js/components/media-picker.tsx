import { useCreateMedia } from '@/api/media/media';
import type { MediaResource } from '@/api/model';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { UploadCloudIcon } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import Cropper from 'react-easy-crop';
import { MediaSelector } from './media-selector';
import { Button } from './ui/button';

export function MediaPicker({
  children,
  value,
  defaultValue,
  onChange,
  type = 'photo',
}: {
  children: (
    value: MediaResource | string | null | undefined,
    change: () => void,
  ) => ReactNode;
  onChange?: (data?: MediaResource | string | null) => void;
  value?: MediaResource | string | null;
  defaultValue?: MediaResource | string | null;
  type: 'image' | 'photo' | 'document';
}) {
  const [internalValue, setInternalValue] = useState<
    MediaResource | string | null | undefined
  >(value || defaultValue);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const uploader = useCreateMedia({
    mutation: {
      onSuccess: (data) => {
        onChange?.(data);
      },
    },
  });

  const handleChange = (value?: MediaResource | string) => {
    setInternalValue(value);
    onChange?.(value);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'document') {
      await uploader.mutateAsync(
        {
          data: { data: file, type: type },
        },
        {
          onSuccess: (data) => {
            setSelectedImage('');
            setOpen(false);
            handleChange(data);
          },
        },
      );
    } else {
      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        e.target.value = ''; // reset input
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
    }
  };

  const handleSelectedMedia = (media: MediaResource) => {
    handleChange(media);
    setOpen(false);
  };

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropAndUpload = async () => {
    try {
      const croppedImage = await getCroppedImg(
        selectedImage,
        croppedAreaPixels!,
        rotation,
      );
      await uploader.mutateAsync(
        {
          data: { data: croppedImage!, type: type },
        },
        {
          onSuccess: (data) => {
            handleChange(data);
            setSelectedImage('');
            setOpen(false);
          },
        },
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  const handleOpen = () => {
    setOpen(true);
  };
  return (
    <Dialog
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          setSelectedImage('');
        }
      }}
      open={open}
    >
      {children(internalValue, handleOpen)}
      {/* <DialogContent className="sm:max-w-[425px]"> */}
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {selectedImage ? (
          <div>
            <div className="relative h-50 w-full">
              <Cropper
                image={selectedImage}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                aspect={type == 'photo' ? 1 : 16 / 9}
                onCropChange={setCrop}
                onRotationChange={setRotation}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="grid grid-cols-2">
              <div>
                <div>Zoom</div>
                <Slider
                  defaultValue={[1]}
                  min={1}
                  max={100}
                  step={1}
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0])}
                />
              </div>
              <div>
                <div>Rotate</div>
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
        ) : (
          <>
            <button
              className="cursor-pointer rounded-md border-2 border-dashed p-4 text-center"
              onClick={() => fileInputRef.current?.click()}
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
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={
                type === 'document'
                  ? 'application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation'
                  : 'image/*'
              }
              onChange={handleFileChange}
            />

            {/*<div className="mt-4 space-y-4">
              <div className="text-sm text-muted-foreground">
                Or select from your existing photos
              </div>
              <MediaSelector
                type={type}
                value={
                  typeof internalValue === 'object'
                    ? (internalValue as MediaResource)
                    : undefined
                }
                onChange={handleSelectedMedia}
              />
            </div>*/}
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">
                Or select from your existing photos or files
              </div>

              {/* 🔽 SCROLL AREA */}
              <div className="max-h-[45vh] overflow-y-auto pr-2">
                <MediaSelector
                  type={type}
                  value={
                    typeof internalValue === 'object'
                      ? (internalValue as MediaResource)
                      : undefined
                  }
                  onChange={handleSelectedMedia}
                />
              </div>
            </div>
          </>
        )}
        <DialogFooter>
          <DialogClose>
            <Button type="button" disabled={uploader.isPending}>
              Cancel
            </Button>
          </DialogClose>
          {selectedImage && (
            <Button
              type="button"
              disabled={uploader.isPending}
              onClick={handleCropAndUpload}
            >
              Upload
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    // Move the resolve ONLY inside the load event listener
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
    // REMOVE resolve(image) from here
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false },
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation,
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');

  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  // As Base64 string
  // return croppedCanvas.toDataURL('image/jpeg');

  // As a blob
  return new Promise((resolve) => {
    croppedCanvas.toBlob((file) => {
      resolve(file);
    });
  });
}
