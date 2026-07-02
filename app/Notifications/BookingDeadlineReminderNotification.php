<?php

namespace App\Notifications;

use App\Models\Booking;
use Carbon\CarbonInterface;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingDeadlineReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public string $deadlineType,
        public CarbonInterface|string $deadlineDate,
        public int $offset,
        public ?array $channels = null,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $this->channels ?? ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $data = $this->toArray($notifiable);

        return (new MailMessage)
            ->subject((string) $data['title'])
            ->view('emails.travelboost-message', [
                'title' => (string) $data['title'],
                'preheader' => (string) $data['message'],
                'eyebrow' => 'Booking Reminder',
                'headline' => (string) $data['title'],
                'intro' => (string) $data['message'],
                'detailsTitle' => 'Booking Details',
                'details' => [
                    ['label' => 'Booking Number', 'value' => (string) $data['booking_number']],
                    ['label' => 'Deadline Type', 'value' => ucfirst((string) $data['deadline_type'])],
                    ['label' => 'Deadline Date', 'value' => (string) $data['deadline_date']],
                ],
                'actionLabel' => 'View Booking',
                'actionUrl' => url((string) $data['action_url']),
                'closing' => 'Please contact customer support if you need help with this booking.',
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $deadlineDate = is_string($this->deadlineDate)
            ? $this->deadlineDate
            : $this->deadlineDate->toDateString();
        $deadlineLabel = $this->deadlineType === 'payment' ? 'payment' : 'travel document';
        $title = $this->offset === 0
            ? ucfirst($deadlineLabel).' deadline is today'
            : ucfirst($deadlineLabel).' deadline reminder';
        $message = $this->offset === 0
            ? "Your {$deadlineLabel} deadline for booking {$this->booking->booking_number} is today."
            : "Your {$deadlineLabel} deadline for booking {$this->booking->booking_number} is in {$this->offset} days.";

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'booking_deadline_reminder',
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'deadline_type' => $this->deadlineType,
            'deadline_date' => $deadlineDate,
            'offset' => $this->offset,
            'action_url' => '/mybookings?'.http_build_query([
                'tab' => 'current',
                'booking_number' => $this->booking->booking_number,
            ]),
        ];
    }
}
