<?php

namespace App\Notifications;

use App\Models\Company;
use App\Models\Tour;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TourAgentPromotionNotification extends Notification
{
    use Queueable;

    public function __construct(
        protected Tour $tour,
        protected Company $vendor
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Tour Opportunity Update',
            'message' => "{$this->vendor->name} has shared {$this->tour->name} with you. Review the itinerary, schedules, and pricing to offer this tour to your customers.",
            'tour_id' => $this->tour->id,
            'tour_name' => $this->tour->name,
            'tour_code' => $this->tour->code,
            'vendor_id' => $this->vendor->id,
            'vendor_name' => $this->vendor->name,
            'type' => 'tour_agent_promotion',
            'action_url' => "/companies/{$notifiable->username}/dashboard/vendors/{$this->vendor->username}/tours",
        ];
    }
}
