<?php

namespace App\Notifications;

use App\Models\Tour;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TourStatusChangedNotification extends Notification
{
    use Queueable;

    protected $tour;

    protected $status;

    public function __construct(Tour $tour, $status)
    {
        $this->tour = $tour;
        $this->status = $status;
    }

    public function via($notifiable)
    {
        // Menggunakan database agar muncul di halaman notifikasi
        return ['database'];
    }

    public function toArray($notifiable)
    {
        $vendorName = $this->tour->company->name;
        $statusLabel = $this->status === 'active' ? 'activated' : 'deactivated';

        return [
            'title' => 'Tour Product Update',
            'message' => "The vendor {$vendorName} has {$statusLabel} the product: \"{$this->tour->name}\".",
            'tour_id' => $this->tour->id,
            'status' => $this->status,
            'type' => 'tour_status_change',
            'action_url' => "/companies/{$notifiable->username}/dashboard/agent-tours",
        ];
    }
}
