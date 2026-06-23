<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class BookingPaymentNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public string $stage,
        public ?Payment $payment = null,
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
        [$title, $message] = $this->copyForStage();

        return [
            'title' => $title,
            'message' => $message,
            'type' => 'booking_payment',
            'stage' => $this->stage,
            'booking_id' => $this->booking->id,
            'booking_number' => $this->booking->booking_number,
            'booking_status' => $this->booking->status?->value,
            'payment_id' => $this->payment?->id,
            'payment_status' => $this->payment?->status?->value,
            'payment_provider' => $this->payment?->provider,
            'payment_type' => data_get($this->payment?->payload, 'payment_type'),
            'amount' => $this->payment ? (float) $this->payment->amount : null,
            'action_url' => '/mybookings?'.http_build_query([
                'tab' => 'current',
                'booking_number' => $this->booking->booking_number,
            ]),
        ];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function copyForStage(): array
    {
        $bookingNumber = $this->booking->booking_number;

        return match ($this->stage) {
            'manual_payment_submitted' => [
                'Manual payment submitted',
                "Your payment proof for booking {$bookingNumber} has been submitted and is waiting for review.",
            ],
            'manual_payment_accepted' => [
                'Manual payment accepted',
                "Your manual payment for booking {$bookingNumber} has been accepted.",
            ],
            'manual_payment_declined' => [
                'Manual payment declined',
                "Your manual payment for booking {$bookingNumber} was declined. Please review your booking payment.",
            ],
            'online_payment_pending' => [
                'Online payment pending',
                "Your online payment for booking {$bookingNumber} is pending.",
            ],
            'online_payment_confirmed' => [
                'Online payment confirmed',
                "Your online payment for booking {$bookingNumber} has been confirmed.",
            ],
            'online_payment_failed' => [
                'Online payment failed',
                "Your online payment for booking {$bookingNumber} could not be completed.",
            ],
            'booking_down_payment' => [
                'Booking down payment received',
                "Booking {$bookingNumber} is now in down payment status.",
            ],
            'booking_full_payment' => [
                'Booking fully paid',
                "Booking {$bookingNumber} is now fully paid.",
            ],
            'booking_cancelled' => [
                'Booking cancelled',
                "Booking {$bookingNumber} has been cancelled.",
            ],
            'booking_refunded' => [
                'Booking refunded',
                "Booking {$bookingNumber} has been marked as refunded.",
            ],
            'booking_rescheduled' => [
                'Booking rescheduled',
                "Booking {$bookingNumber} has been rescheduled to a new departure date.",
            ],
            'booking_rescheduled_balance_due' => [
                'Reschedule balance due',
                "Booking {$bookingNumber} has been rescheduled. An additional payment is required to complete the new total.",
            ],
            'booking_rescheduled_credit' => [
                'Reschedule credit available',
                "Booking {$bookingNumber} has been rescheduled. A credit balance is available — please contact the vendor to arrange a refund.",
            ],
            'booking_reactivated' => [
                'Booking reactivated',
                "Booking {$bookingNumber} has been reactivated and is active again.",
            ],
            default => [
                'Booking payment update',
                "There is a payment update for booking {$bookingNumber}.",
            ],
        };
    }
}
