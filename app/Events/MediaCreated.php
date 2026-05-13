<?php

namespace App\Events;

use App\Models\Media;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MediaCreated
{
  use Dispatchable, SerializesModels;

  /**
   * Create a new event instance.
   */
  public function __construct(public Media $media) {}
}
