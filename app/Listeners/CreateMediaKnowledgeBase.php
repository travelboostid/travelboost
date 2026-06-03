<?php

namespace App\Listeners;

use App\Events\MediaCreated;
use App\Services\KnowledgeBaseService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateMediaKnowledgeBase implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct(private KnowledgeBaseService $knowledgeBaseService) {}

    /**
     * Handle the event.
     */
    public function handle(MediaCreated $event): void
    {
        $media = $event->media;
        $this->knowledgeBaseService->generateMediaKnowledgeBase($media);
    }
}
