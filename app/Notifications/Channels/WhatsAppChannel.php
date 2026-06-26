<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Placeholder WhatsApp channel for future provider integration (Phase 8).
 */
class WhatsAppChannel
{
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWhatsApp')) {
            return;
        }

        Log::info('WhatsApp notification channel is not configured yet.', [
            'notifiable_id' => $notifiable->id ?? null,
            'notification' => $notification::class,
        ]);
    }
}
