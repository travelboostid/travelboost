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
        $status = ucfirst($this->payment->status->value);
        $amountStr = 'Rp '.number_format($this->payment->amount, 0, ',', '.');

        $message = (new MailMessage)
            ->subject("Manual Top-up {$status}")
            ->line("Your manual wallet top-up of {$amountStr} has been {$status}.");

        if ($this->payment->status->value === 'failed') {
            $message->line('Reason: The transfer proof was invalid or the funds were not received.');
        }

        return $message->line('Thank you for using Travelboost!');
    }

    public function toArray(object $notifiable): array
    {
        $status = ucfirst($this->payment->status->value);
        $amountStr = 'Rp '.number_format($this->payment->amount, 0, ',', '.');

        return [
            'title' => "Manual Top-up {$status}",
            'message' => "Your manual wallet top-up of {$amountStr} has been {$status}.",
            'payment_id' => $this->payment->id,
            'status' => $this->payment->status->value,
        ];
    }
}
