<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\TourWaitingListSchedule;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WaitingListSeatAvailableNotification extends Notification
{
    use Queueable;

    public function __construct(
        public TourWaitingListSchedule $schedule,
        public Booking $booking,
        public CarbonInterface $offerExpiresAt,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = config('waiting-list.notification_channels', ['database', 'mail']);

        return is_array($channels) ? $channels : ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->toArray($notifiable);

        return (new MailMessage)
            ->subject((string) $data['title'])
            ->greeting('Hello,')
            ->line((string) $data['message'])
            ->action('Complete Booking', url((string) $data['action_url']))
            ->line('This seat offer expires on '.$this->offerExpiresAt->timezone(config('app.timezone'))->format('d M Y H:i').'.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $tour = $this->schedule->waitingList?->tour;
        $departureDate = $this->schedule->tourSchedule?->departure_date;
        $tourName = $tour?->name ?? 'your tour';
        $departureLabel = $departureDate instanceof \DateTimeInterface
            ? $departureDate->format('d M Y')
            : (string) $departureDate;

        return [
            'title' => 'A seat is available for your waiting list',
            'message' => "Good news! Seats are now available for {$tourName} departing {$departureLabel}. Complete your booking within ".config('waiting-list.offer_hours', 24).' hours.',
            'type' => 'waiting_list_seat_available',
            'waiting_list_id' => $this->schedule->tour_waiting_list_id,
            'waiting_list_schedule_id' => $this->schedule->id,
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'offer_expires_at' => $this->offerExpiresAt->toIso8601String(),
            'action_url' => $this->bookingActionUrl(),
        ];
    }

    private function bookingActionUrl(): string
    {
        $departureDate = $this->schedule->tourSchedule?->departure_date;
        $date = $departureDate instanceof \DateTimeInterface
            ? $departureDate->format('Y-m-d')
            : (string) $departureDate;
        $tourId = $this->booking->tour_id;

        $params = http_build_query([
            'date' => $date,
            'booking_number' => $this->booking->booking_number,
            'waiting_list_schedule_id' => $this->schedule->id,
        ]);

        return '/bookings/'.$tourId.'/create?'.$params;
    }
}
