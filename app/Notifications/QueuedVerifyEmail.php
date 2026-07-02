<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Lang;

class QueuedVerifyEmail extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        if (static::$toMailCallback) {
            return call_user_func(static::$toMailCallback, $notifiable, $verificationUrl);
        }

        return (new MailMessage)
            ->subject(Lang::get('Verify your email address'))
            ->view('emails.travelboost-message', [
                'title' => Lang::get('Verify your email address'),
                'preheader' => Lang::get('Please verify your TravelBoost email address to continue.'),
                'eyebrow' => 'Email Verification',
                'headline' => Lang::get('Verify your email address'),
                'intro' => Lang::get('Please click the button below to verify your email address.'),
                'detailsTitle' => 'Verification Details',
                'details' => [
                    ['label' => 'Email', 'value' => $notifiable->getEmailForVerification()],
                    ['label' => 'Status', 'value' => 'Pending Verification'],
                ],
                'actionLabel' => Lang::get('Verify Email Address'),
                'actionUrl' => $verificationUrl,
                'closing' => Lang::get('If you did not create an account, no further action is required.'),
            ]);
    }
}
