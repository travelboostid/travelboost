<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ManualTopupValidated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Payment $payment
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->statusLabel();
        $amount = 'Rp '.number_format($this->payment->amount, 0, ',', '.');
        [$subject, $message, $failureMessage] = $this->content();
        $resolvedSubject = str_replace(':status', $status, $subject);
        $resolvedMessage = str_replace([':status', ':amount'], [$status, $amount], $message);
        $closing = $this->payment->status->value === 'failed'
            ? $failureMessage.' Thank you for using TravelBoost.'
            : 'Thank you for using TravelBoost.';

        return (new MailMessage)
            ->subject($resolvedSubject)
            ->view('emails.travelboost-message', [
                'title' => $resolvedSubject,
                'preheader' => $resolvedMessage,
                'eyebrow' => 'Payment Update',
                'headline' => $resolvedSubject,
                'intro' => $resolvedMessage,
                'detailsTitle' => 'Payment Details',
                'details' => [
                    ['label' => 'Amount', 'value' => $amount],
                    ['label' => 'Status', 'value' => $status],
                    ['label' => 'Reference', 'value' => (string) $this->payment->reference],
                ],
                'closing' => $closing,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        $status = $this->statusLabel();
        $amount = 'Rp '.number_format($this->payment->amount, 0, ',', '.');
        [$subject, $message] = $this->content();

        return [
            'title' => str_replace(':status', $status, $subject),
            'message' => str_replace([':status', ':amount'], [$status, $amount], $message),
            'payment_id' => $this->payment->id,
            'status' => $this->payment->status->value,
        ];
    }

    /**
     * @return array{0: string, 1: string, 2: string}
     */
    private function content(): array
    {
        return match ($this->payment->payable_type) {
            'agent-subscription-payment' => [
                'Manual Subscription Payment :status',
                'Your manual subscription payment of :amount has been :status.',
                'Reason: The transfer proof was invalid or the funds were not received. Your subscription has not been activated.',
            ],
            'ai-credit-topup-payment' => [
                'Manual AI Credit Top-up :status',
                'Your manual AI credit top-up of :amount has been :status.',
                'Reason: The transfer proof was invalid or the funds were not received.',
            ],
            default => [
                'Manual Top-up :status',
                'Your manual wallet top-up of :amount has been :status.',
                'Reason: The transfer proof was invalid or the funds were not received.',
            ],
        };
    }

    private function statusLabel(): string
    {
        return match ($this->payment->status->value) {
            'paid' => 'Approved',
            'failed' => 'Rejected',
            default => ucfirst($this->payment->status->value),
        };
    }
}
