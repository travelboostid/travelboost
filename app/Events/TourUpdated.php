<?php

namespace App\Events;

use App\Models\Tour;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TourUpdated
{
  use Dispatchable, InteractsWithSockets, SerializesModels;

  public function __construct(public Tour $tour)
  {
    //
  }
}
