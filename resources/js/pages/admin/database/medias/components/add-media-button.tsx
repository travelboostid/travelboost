import type { MediaResource } from '@/api/model';
import { ImageMediaUploader } from '@/components/media/image-media-uploader';
import { RawMediaUploader } from '@/components/media/raw-media-uploader';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { UploadCloudIcon } from 'lucide-react';
import { useState } from 'react';
import MediaOwnerSelector from './media-owner-selector';

type AddMediaButtonProps = {
    afterUpload?: (data?: MediaResource | string | null) => void;
};

export function AddMediaButton({
    afterUpload: afterUpload,
}: AddMediaButtonProps) {
    const [open, setOpen] = useState(false);
    const [owner, setOwner] = useState<string | undefined>();
    const [subtype, setSubtype] = useState('tour-image');
    const ownerType = owner?.split(':')?.[0];
    const ownerId = Number(owner?.split(':')?.[1]);

    const handleChange = (value?: MediaResource | string) => {
        afterUpload?.(value);
    };

    const handleAfterUpload = (data: MediaResource) => {
        setOpen(false);
        handleChange(data);
    };

    return (
        <AlertDialog onOpenChange={setOpen} open={open}>
            <AlertDialogTrigger>
                <Button className="w-fit cursor-pointer" type="button">
                    Add Media
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="w-full max-w-200">
                <Field>
                    <FieldLabel>Owner</FieldLabel>
                    <MediaOwnerSelector value={owner} onChange={setOwner} />
                </Field>
                <Field>
                    <FieldLabel>Type</FieldLabel>

                    <Select value={subtype} onValueChange={setSubtype}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select media type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Media type</SelectLabel>
                                <SelectItem value="tour-image">
                                    Tour Image
                                </SelectItem>
                                <SelectItem value="tour-document">
                                    Tour Document
                                </SelectItem>
                                <SelectItem value="photo">Photo</SelectItem>
                                <SelectItem value="general-knowledge-base-document">
                                    General Knowlege Base
                                </SelectItem>
                                <SelectItem value="identity-card">
                                    ID Card
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </Field>

                {owner && subtype === 'tour-image' && (
                    <ImageMediaUploader
                        afterUpload={handleAfterUpload}
                        aspect={16 / 9}
                        uploadParams={{
                            owner_type: ownerType,
                            owner_id: ownerId,
                            type: 'image',
                            subtype: 'tour-image',
                        }}
                        trigger={({ open }) => (
                            <button
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
                                    Choose an image file from your device to
                                    upload as your new avatar.
                                </p>
                            </button>
                        )}
                    />
                )}
                {owner && subtype === 'tour-document' && (
                    <RawMediaUploader
                        afterUpload={handleAfterUpload}
                        accept="application/pdf"
                        uploadParams={{
                            owner_type: ownerType,
                            owner_id: ownerId,
                            type: 'document',
                            subtype: 'tour-document',
                        }}
                        trigger={({ open }) => (
                            <button
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
                )}
                {owner && subtype === 'photo' && (
                    <ImageMediaUploader
                        afterUpload={handleAfterUpload}
                        aspect={1}
                        uploadParams={{
                            owner_type: ownerType,
                            owner_id: ownerId,
                            type: 'image',
                            subtype: 'photo',
                        }}
                        trigger={({ open }) => (
                            <button
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
                                    Choose an image file from your device to
                                    upload as your new avatar.
                                </p>
                            </button>
                        )}
                    />
                )}

                {owner && subtype === 'general-knowledge-base-document' && (
                    <RawMediaUploader
                        afterUpload={handleAfterUpload}
                        accept="application/pdf"
                        uploadParams={{
                            owner_type: ownerType,
                            owner_id: ownerId,
                            type: 'document',
                            subtype: 'general-knowledge-base-document',
                        }}
                        trigger={({ open, progress, status }) => {
                            return (
                                <div
                                    className={cn(
                                        'rounded-md border-2 border-dashed p-4 text-left cursor-pointer space-y-4',
                                        status == 'pending' &&
                                            'pointer-events-none opacity-70 cursor-not-allowed',
                                    )}
                                    onClick={open}
                                >
                                    <div className="flex flex-row gap-2 items-center">
                                        <UploadCloudIcon className="inline-block" />
                                        <div className="flex-1">
                                            <div className="inline-block font-semibold">
                                                Upload General Knowledge Base
                                                Document
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Select a document that contains
                                                general knowledge about your
                                                tours, such as FAQs, policies,
                                                or guidelines. This document
                                                will be used to provide accurate
                                                and consistent information to
                                                customers and support staff.
                                            </div>
                                        </div>
                                    </div>
                                    {status !== 'idle' && (
                                        <Field className="w-full">
                                            <FieldLabel htmlFor="progress-upload">
                                                <span>Upload progress</span>
                                                <span className="ml-auto">
                                                    {progress.percentage}%
                                                </span>
                                            </FieldLabel>
                                            <Progress
                                                value={progress.percentage}
                                                id="progress-upload"
                                            />
                                        </Field>
                                    )}
                                </div>
                            );
                        }}
                    />
                )}
                {owner && subtype === 'identity-card' && (
                    <RawMediaUploader
                        afterUpload={handleAfterUpload}
                        accept="image/jpeg,application/pdf"
                        uploadParams={{
                            owner_type: ownerType,
                            owner_id: ownerId,
                            type: 'document',
                            subtype: 'identity-card',
                        }}
                        trigger={({ open, progress, status }) => {
                            return (
                                <div
                                    className={cn(
                                        'rounded-md border-2 border-dashed p-4 text-left cursor-pointer space-y-4',
                                        status == 'pending' &&
                                            'pointer-events-none opacity-70 cursor-not-allowed',
                                    )}
                                    onClick={open}
                                >
                                    <div className="flex flex-row gap-2 items-center">
                                        <UploadCloudIcon className="inline-block" />
                                        <div className="flex-1">
                                            <div className="inline-block font-semibold">
                                                Upload Identity Card
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Please upload a clear image or
                                                scan of your identity card for
                                                verification purposes.
                                            </div>
                                        </div>
                                    </div>
                                    {status !== 'idle' && (
                                        <Field className="w-full">
                                            <FieldLabel htmlFor="progress-upload">
                                                <span>Upload progress</span>
                                                <span className="ml-auto">
                                                    {progress.percentage}%
                                                </span>
                                            </FieldLabel>
                                            <Progress
                                                value={progress.percentage}
                                                id="progress-upload"
                                            />
                                        </Field>
                                    )}
                                </div>
                            );
                        }}
                    />
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
