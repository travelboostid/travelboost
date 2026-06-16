<?php

namespace App\Listeners;

use App\Enums\MediaType;
use App\Events\MediaDeleting;
use App\Models\KnowledgeBase;
use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Storage;

class DeleteMediaReferences implements ShouldQueue
{
    use InteractsWithQueue;

    public bool $deleteWhenMissingModels = true;

    public function handle(MediaDeleting $event): void
    {
        $media = $event->media;
        $this->deleteMediaKnowledgeBase($media);
        $this->deleteMediaFiles($media);
    }

    private function deleteMediaKnowledgeBase(Media $media): void
    {
        KnowledgeBase::where('owner_type', Media::class)->where('owner_id', $media->id)->delete();
    }

    private function deleteMediaFiles(Media $media): void
    {
        switch ($media->type) {
            case MediaType::IMAGE:
                foreach ($media->data['files'] ?? [] as $file) {
                    $this->deleteStoredFile(
                        is_string($file['path'] ?? null) ? $file['path'] : null,
                        is_string($file['url'] ?? null) ? $file['url'] : null,
                    );
                }
                break;

            case MediaType::DOCUMENT:
            case MediaType::RAW:
                $this->deleteStoredFile(
                    is_string($media->data['path'] ?? null) ? $media->data['path'] : null,
                    is_string($media->data['url'] ?? null) ? $media->data['url'] : null,
                );
                break;
        }
    }

    private function deleteStoredFile(?string $path, ?string $url): void
    {
        $storageKey = Media::storageKey($path) ?? Media::storagePathFromUrl($url);

        if ($storageKey === null) {
            return;
        }

        Storage::disk('public')->delete($storageKey);
    }
}
