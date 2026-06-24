import type { Media, MediaResource } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { UploadCloudIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Item, ItemActions, ItemContent, ItemTitle } from '../ui/item';
import { MediaSelector } from './media-selector';
import { RawMediaUploader } from './raw-media-uploader';

type TourDocumentPickerProps = {
    onChange?: (data?: MediaResource | string | null) => void;
    value?: MediaResource | string | null;
    defaultValue?: MediaResource | Media | string | null;
    owner: { id: number; type: string };
};

export function TourDocumentPicker({
    value,
    defaultValue,
    onChange,
    owner,
}: TourDocumentPickerProps) {
    const [internalValue, setInternalValue] = useState<
        MediaResource | Media | string | null | undefined
    >(value || defaultValue);

    const [open, setOpen] = useState(false);

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

    const rawDocumentUrl =
        typeof internalValue === 'object' && internalValue !== null
            ? ((internalValue as any)?.data?.url ?? '')
            : '';

    const normalizedPreviewUrl = useMemo(() => {
        if (!rawDocumentUrl) {
            return '';
        }

        if (/^https?:\/\//i.test(rawDocumentUrl)) {
            return rawDocumentUrl;
        }

        if (/^https\/\//i.test(rawDocumentUrl)) {
            return rawDocumentUrl.replace(/^https\/\//i, 'https://');
        }

        if (/^http\/\//i.test(rawDocumentUrl)) {
            return rawDocumentUrl.replace(/^http\/\//i, 'http://');
        }

        if (rawDocumentUrl.startsWith('//')) {
            return `${window.location.protocol}${rawDocumentUrl}`;
        }

        if (rawDocumentUrl.startsWith('/')) {
            return `${window.location.origin}${rawDocumentUrl}`;
        }

        return `${window.location.origin}/${rawDocumentUrl}`;
    }, [rawDocumentUrl]);

    return (
        <Item variant="outline" className="space-y-2">
            <ItemContent className="space-y-2">
                {internalValue ? (
                    <div className="rounded border bg-muted/20 p-4 space-y-3">
                        <p className="text-sm font-medium break-all">
                            {(internalValue as any)?.name ||
                                'Document uploaded'}
                        </p>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                >
                                    View PDF
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="h-[90vh] max-w-5xl">
                                <iframe
                                    src={normalizedPreviewUrl}
                                    className="h-full w-full rounded-md border"
                                    title="PDF Preview"
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <ItemTitle>No document selected</ItemTitle>
                )}
            </ItemContent>

            <ItemActions>
                <Dialog onOpenChange={setOpen} open={open}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" type="button">
                            Change
                        </Button>
                    </DialogTrigger>

                    <DialogContent className="w-full max-w-200">
                        <RawMediaUploader
                            afterUpload={handleAfterUpload}
                            accept="application/pdf"
                            uploadParams={{
                                owner_type: owner.type,
                                owner_id: owner.id,
                                type: 'document',
                                subtype: 'tour-document',
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

                                    <h1 className="mb-2 font-medium">
                                        Click Here to Upload
                                    </h1>

                                    <p className="mb-4 text-sm text-muted-foreground">
                                        Choose a PDF document from your device.
                                    </p>
                                </button>
                            )}
                        />

                        <MediaSelector
                            display="list"
                            params={{
                                owner_type: owner.type,
                                owner_id: owner.id,
                                type: 'document',
                                subtype: 'tour-document',
                            }}
                            onChange={handleSelectedMedia}
                        />

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button">Cancel</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </ItemActions>
        </Item>
    );
}
