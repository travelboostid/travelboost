<?php

namespace App\Notifications;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingManualPaymentReviewNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public Payment $payment,
        public Company $company,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $bookingNumber = $this->booking->booking_number;

        return [
            'title' => 'Manual payment needs review',
            'message' => "Booking {$bookingNumber} has a manual payment proof waiting for approval.",
            'type' => 'booking_manual_payment_review',
            'stage' => 'manual_payment_submitted',
            'booking_id' => $this->booking->id,
            'booking_number' => $bookingNumber,
            'booking_status' => $this->booking->status?->value,
            'payment_id' => $this->payment->id,
            'payment_status' => $this->payment->status?->value,
            'payment_provider' => $this->payment->provider,
            'payment_type' => data_get($this->payment->payload, 'booking_payment_type')
                ?: data_get($this->payment->payload, 'payment_type'),
            'amount' => (float) $this->payment->amount,
            'action_label' => 'Review Payment',
            'action_url' => "/companies/{$this->company->username}/dashboard/bookings?".http_build_query([
                'status' => BookingStatus::WAITING_PAYMENT_APPROVAL->value,
                'booking_number' => $bookingNumber,
                'review_payment' => $this->payment->id,
            ]),
        ];
    }
}
