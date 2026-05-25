import type { Media, MediaResource } from '@/api/model';
import {
    CheckIcon,
    DownloadIcon,
    TrashIcon,
    UploadCloudIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { RawMediaUploader } from './raw-media-uploader';

type IdentityCardPickerProps = {
    onChange?: (data?: MediaResource | string | null) => void;
    value?: MediaResource | string | null;
    defaultValue?: MediaResource | Media | string | null;
    owner: { id: number; type: string };
};

export function IdentityCardPicker({
    value,
    defaultValue,
    onChange,
    owner,
}: IdentityCardPickerProps) {
    const [internalValue, setInternalValue] = useState<
        MediaResource | Media | string | null | undefined
    >(value || defaultValue);
    const handleChange = (value?: MediaResource | string) => {
        setInternalValue(value);
        onChange?.(value);
    };

    const handleAfterUpload = (data: MediaResource) => {
        handleChange(data);
    };

    return (
        <RawMediaUploader
            afterUpload={handleAfterUpload}
            accept="image/jpeg,application/pdf"
            uploadParams={{
                owner_type: owner.type,
                owner_id: owner.id,
                type: 'document',
                subtype: 'identity-card',
            }}
            trigger={({ open, progress }) => {
                if (internalValue) {
                    return (
                        <div className="rounded-md border-2 border-dashed border-primary p-4 text-left flex flex-row gap-2 items-center">
                            <CheckIcon className="inline-block text-primary" />
                            <div className="flex-1">
                                <div className="inline-block font-semibold text-primary">
                                    You've uploaded an identity card.
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Click remove to delete the uploaded identity
                                    card and reupload, or click download to see
                                    the uploaded file.
                                </div>
                            </div>
                            <div className="space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleChange(undefined)}
                                    className="rounded-full cursor-pointer text-destructive"
                                >
                                    <TrashIcon />
                                </Button>
                                <a
                                    href={
                                        (internalValue as any)?.data?.url || '#'
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="rounded-full cursor-pointer"
                                    >
                                        <DownloadIcon />
                                    </Button>
                                </a>
                            </div>
                        </div>
                    );
                } else {
                    return (
                        <div className="rounded-md border-2 border-dashed p-4 text-left flex flex-row gap-2 items-center">
                            <UploadCloudIcon className="inline-block" />
                            <div className="flex-1">
                                <div className="inline-block font-semibold">
                                    Upload Identity Card
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Please upload a clear image or scan of your
                                    identity card for verification purposes.
                                </div>
                            </div>
                            <div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="cursor-pointer"
                                    disabled={
                                        progress.percentage !== undefined &&
                                        progress.percentage < 100
                                    }
                                    onClick={open}
                                >
                                    Upload{' '}
                                    {progress.percentage
                                        ? `${Math.round(progress.percentage)}%`
                                        : ''}
                                </Button>
                            </div>
                        </div>
                    );
                }
            }}
        />
    );
}
