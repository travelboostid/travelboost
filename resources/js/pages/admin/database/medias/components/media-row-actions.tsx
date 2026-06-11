import type { MediaResource } from '@/api/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { extractDocumentUrl, extractImageSrc } from '@/lib/utils';
import {
    edit,
    triggerGenerateKnowledgeBase,
} from '@/routes/admin/database/medias';
import { Link, router } from '@inertiajs/react';
import dayjs from 'dayjs';
import { BookIcon, EyeIcon, MoreHorizontal, PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import DeleteButton from './delete-button';

export type AdminMediaRow = MediaResource & {
    owner?: {
        id: number;
        name?: string | null;
    } | null;
};

function DetailRow({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-3 items-start gap-4 border-b border-border py-2.5 last:border-b-0">
            <span className="text-sm font-medium text-muted-foreground">
                {label}
            </span>
            <span className="col-span-2 break-words text-sm font-medium text-foreground">
                {value || '—'}
            </span>
        </div>
    );
}

function MediaPreview({ media }: { media: AdminMediaRow }) {
    if (media.type === 'image') {
        const { src, srcSet } = extractImageSrc(media);

        return (
            <img
                src={src}
                srcSet={srcSet}
                alt={media.name || 'Media preview'}
                className="max-h-48 rounded-md border object-contain"
            />
        );
    }

    if (media.type === 'document') {
        const url = extractDocumentUrl(media);

        if (!url) {
            return (
                <p className="text-sm text-muted-foreground">
                    No preview available.
                </p>
            );
        }

        return (
            <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline-offset-2 hover:underline"
            >
                Open document
            </a>
        );
    }

    return (
        <p className="text-sm text-muted-foreground">No preview available.</p>
    );
}

export function MediaRowActions({ media }: { media: AdminMediaRow }) {
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [generating, setGenerating] = useState(false);

    const handleGenerateKnowledgeBase = () => {
        router.post(
            triggerGenerateKnowledgeBase(media.id).url,
            {},
            {
                onBefore: () => setGenerating(true),
                onSuccess: () => {
                    toast.success('Knowledge base generated successfully.');
                },
                onError: () => {
                    toast.error('Failed to generate knowledge base.');
                },
                onFinish: () => setGenerating(false),
            },
        );
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                    >
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Open menu</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                        className="cursor-pointer"
                        onSelect={(event) => {
                            event.preventDefault();
                            setDetailsOpen(true);
                        }}
                    >
                        <EyeIcon className="size-4" />
                        View details
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="cursor-pointer">
                        <Link
                            href={edit({ media: media.id }).url}
                            className="flex items-center gap-2"
                        >
                            <PencilIcon className="size-4" />
                            Edit
                        </Link>
                    </DropdownMenuItem>
                    {media.subtype === 'tour-document' ? (
                        <DropdownMenuItem
                            className="cursor-pointer"
                            disabled={generating}
                            onSelect={(event) => {
                                event.preventDefault();
                                handleGenerateKnowledgeBase();
                            }}
                        >
                            <BookIcon className="size-4" />
                            Generate KB
                        </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <div className="px-1 py-1">
                        <DeleteButton data={media} variant="menu" />
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="sm:max-w-[520px]">
                    <DialogHeader>
                        <DialogTitle>Media details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <MediaPreview media={media} />
                        <div>
                            <DetailRow label="ID" value={media.id} />
                            <DetailRow label="Name" value={media.name} />
                            <DetailRow
                                label="Description"
                                value={media.description}
                            />
                            <DetailRow
                                label="Type"
                                value={
                                    media.type ? (
                                        <Badge
                                            variant="secondary"
                                            className="capitalize"
                                        >
                                            {media.type}
                                        </Badge>
                                    ) : undefined
                                }
                            />
                            <DetailRow
                                label="Subtype"
                                value={
                                    media.subtype ? (
                                        <Badge variant="outline">
                                            {media.subtype}
                                        </Badge>
                                    ) : undefined
                                }
                            />
                            <DetailRow
                                label="Owner"
                                value={media.owner?.name}
                            />
                            <DetailRow
                                label="Created"
                                value={
                                    media.created_at
                                        ? dayjs(media.created_at).format(
                                              'D MMM YYYY, HH:mm',
                                          )
                                        : undefined
                                }
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
