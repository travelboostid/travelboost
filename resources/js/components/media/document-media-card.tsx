import type { MediaResource } from '@/api/model';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';
import { FileIcon } from 'lucide-react';

export type DocumentMediaCardProps = {
    media: MediaResource;
    selected?: boolean;
    onClick?: () => void;
};
export default function DocumentMediaCard({
    media,
    selected,
    onClick,
}: DocumentMediaCardProps) {
    // const mediaData = media.data as DocumentMediaData;
    return (
        <Item
            variant="outline"
            size="sm"
            className={
                selected
                    ? 'ring-2 ring-primary'
                    : 'hover:ring-2 hover:ring-primary/40'
            }
        >
            <ItemMedia>
                <FileIcon className="size-5" />
            </ItemMedia>
            <ItemContent className="">
                <ItemTitle>{media.name}</ItemTitle>
            </ItemContent>
            <ItemActions>
                <Button onClick={onClick}>Select</Button>
            </ItemActions>
        </Item>
    );
}
