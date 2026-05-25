import type { MediaResource } from '@/api/model';
import DocumentMediaCard from './document-media-card';
import ImageMediaCard from './image-media-card';
import MiscMediaCard from './misc-media-card';
import PhotoMediaCard from './photo-media-card';

export function MediaCard({
    media,
    selected,
    onClick,
}: {
    media: MediaResource;
    selected?: boolean;
    onClick?: () => void;
}) {
    const componentMap = {
        document: DocumentMediaCard,
        photo: PhotoMediaCard,
        image: ImageMediaCard,
        misc: MiscMediaCard,
    };

    const key = media.type as keyof typeof componentMap;

    const Component = componentMap[key] || ImageMediaCard;

    return <Component media={media} selected={selected} onClick={onClick} />;
}
