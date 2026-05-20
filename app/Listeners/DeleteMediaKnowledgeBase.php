<?php

namespace App\Listeners;

use App\Events\MediaDeleted;
use App\Models\KnowledgeBase;
use App\Models\Media;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class DeleteMediaKnowledgeBase implements ShouldQueue
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
    public function handle(MediaDeleted $event): void
    {
        $media = $event->media;
        KnowledgeBase::where('owner_type', Media::class)->where('owner_id', $media->id)->delete();
    }
}
