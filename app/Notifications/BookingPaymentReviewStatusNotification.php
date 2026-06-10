<?php

namespace App\Notifications;

use App\Models\Booking;
use App\Models\Company;
use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class BookingPaymentReviewStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Booking $booking,
        public Payment $payment,
        public Company $reviewerCompany,
        public string $decision,
        public ?string $attachmentData = null,
        public ?string $attachmentName = null,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $isOnlineConfirmed = $this->decision === 'online_confirmed';
        $isAccepted = $this->decision === 'accepted' || $isOnlineConfirmed;
        $paymentType = $this->paymentTypeLabel();
        $subject = $this->subject($isAccepted, $isOnlineConfirmed);

        $mailMessage = (new MailMessage)
            ->subject($subject)
            ->view('emails.booking-payment-review-status', [
                'eyebrow' => 'TravelBoost Payment Update',
                'headline' => $isAccepted
                    ? 'Your booking payment has been confirmed'
                    : 'Your booking payment has been declined',
                'intro' => $isAccepted
                    ? $this->confirmedIntro($paymentType, $isOnlineConfirmed)
                    : "{$this->reviewerCompany->name} has declined your {$paymentType} payment for this booking. Please review the booking and follow up with the travel company if needed.",
                'details' => [
                    ['label' => 'Booking Number', 'value' => $this->booking->booking_number],
                    ['label' => 'Tour Product', 'value' => $this->booking->tour?->name ?? '-'],
                    ['label' => 'Payment Type', 'value' => $paymentType],
                    [
                        'label' => $isOnlineConfirmed ? 'Confirmed By' : 'Reviewed By',
                        'value' => $isOnlineConfirmed ? 'TravelBoost Online Payment' : $this->reviewerCompany->name,
                    ],
                    ['label' => 'Decision', 'value' => $isAccepted ? 'Confirmed' : 'Declined'],
                    ['label' => 'Amount', 'value' => $this->formatRupiah((float) $this->payment->amount)],
                ],
                'actionLabel' => 'View My Bookings',
                'actionUrl' => url('/mybookings'),
                'closing' => $isAccepted
                    ? 'Thank you for booking with TravelBoost. You can review your latest booking details anytime from your customer account.'
                    : 'If you believe this payment should be accepted, please contact the travel company directly and resubmit the correct payment proof if necessary.',
            ]);

        if ($this->attachmentData && $this->attachmentName) {
            $mailMessage->attachData($this->attachmentData, $this->attachmentName, [
                'mime' => 'application/pdf',
            ]);
        }

        return $mailMessage;
    }

    private function subject(bool $isAccepted, bool $isOnlineConfirmed): string
    {
        if ($isOnlineConfirmed) {
            return 'Your online payment has been confirmed';
        }

        return $isAccepted
            ? 'Your payment has been confirmed'
            : 'Your payment has been declined';
    }

    private function confirmedIntro(string $paymentType, bool $isOnlineConfirmed): string
    {
        if ($isOnlineConfirmed) {
            return "Your {$paymentType} online payment for this booking has been confirmed. {$this->reviewerCompany->name} has received the payment information for this tour booking.";
        }

        return "{$this->reviewerCompany->name} has confirmed your {$paymentType} payment for this booking.";
    }

    private function paymentTypeLabel(): string
    {
        $paymentType = data_get($this->payment->payload, 'booking_payment_type')
            ?: data_get($this->payment->payload, 'payment_type');

        return match ((string) $paymentType) {
            'down_payment' => 'Down Payment',
            'full_payment' => 'Full Payment',
            default => 'Booking',
        };
    }

    private function formatRupiah(float $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }
}
