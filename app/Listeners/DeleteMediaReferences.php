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

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
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
                    $this->deleteByUrl($file['url']);
                }
                break;

            case MediaType::DOCUMENT:
            case MediaType::RAW:
                $this->deleteByUrl($media->data['url'] ?? null);
                break;
        }
    }

    private function deleteByUrl(?string $url): void
    {
        if (! $url) {
            return;
        }

        $path = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));

        Storage::disk('public')->delete($path);
    }
}
