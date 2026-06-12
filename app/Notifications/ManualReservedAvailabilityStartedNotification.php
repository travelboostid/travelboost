<?php

namespace App\Notifications;

use App\Models\Tour;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class ManualReservedAvailabilityStartedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Tour $tour,
        public int $reservedSeats,
        public ?int $scheduleId = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $seatLabel = $this->reservedSeats === 1 ? 'seat is' : 'seats are';

        return [
            'title' => 'Manual reserved started',
            'message' => "{$this->reservedSeats} {$seatLabel} now manually reserved for tour \"{$this->tour->name}\".",
            'type' => 'manual_reserved_started',
            'tour_id' => $this->tour->id,
            'schedule_id' => $this->scheduleId,
            'reserved_seats' => $this->reservedSeats,
            'action_url' => "/companies/{$notifiable->username}/dashboard/tours/{$this->tour->id}/edit",
        ];
    }
}
