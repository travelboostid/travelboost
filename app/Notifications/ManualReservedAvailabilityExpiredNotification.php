<?php

namespace App\Notifications;

use App\Models\Tour;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ManualReservedAvailabilityExpiredNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Tour $tour,
        public int $releasedSeats,
        public ?int $scheduleId = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $seatLabel = $this->releasedSeats === 1 ? 'seat has' : 'seats have';

        return [
            'title' => 'Manual reserved expired',
            'message' => "{$this->releasedSeats} {$seatLabel} been reopened to the public for tour \"{$this->tour->name}\".",
            'type' => 'manual_reserved_expired',
            'tour_id' => $this->tour->id,
            'schedule_id' => $this->scheduleId,
            'released_seats' => $this->releasedSeats,
            'action_url' => "/companies/{$notifiable->username}/dashboard/tours/{$this->tour->id}/edit",
        ];
    }
}
