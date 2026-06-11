import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import usePageSharedDataProps from '@/hooks/use-page-shared-data-props';
import { cn, extractImageSrc } from '@/lib/utils';
import { ImageIcon, UploadIcon } from 'lucide-react';

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
                onChange(
                    typeof v === 'string' ? v : extractImageSrc(v as any).src,
                )
            }
        >
            {(media, change) => {
                const src =
                    typeof media === 'string'
                        ? media
                        : extractImageSrc(media as any).src;
                const hasImage = Boolean(src);

                return (
                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={change}
                            className={cn(
                                'group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition',
                                hasImage
                                    ? 'border-border hover:border-primary/50'
                                    : 'border-muted-foreground/25 bg-muted/30 hover:border-primary/40 hover:bg-muted/50',
                            )}
                        >
                            {hasImage ? (
                                <>
                                    <img
                                        className="aspect-video w-full object-cover"
                                        src={src}
                                        alt="Selected"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-medium text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                                        Change image
                                    </span>
                                </>
                            ) : (
                                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                                    <ImageIcon className="size-8 opacity-40" />
                                    <span className="text-sm font-medium">
                                        Choose or upload image
                                    </span>
                                </div>
                            )}
                        </button>
                        <input
                            type="hidden"
                            name={name}
                            value={(media as any)?.id}
                        />
                        <div className="flex gap-2">
                            <Button
                                className="flex-1"
                                onClick={change}
                                type="button"
                                variant={hasImage ? 'outline' : 'default'}
                                size="sm"
                            >
                                <UploadIcon className="size-4" />
                                {hasImage ? 'Replace' : 'Upload'}
                            </Button>
                            {hasImage && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onChange('')}
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    </div>
                );
            }}
        </MediaPicker>
    );
}
