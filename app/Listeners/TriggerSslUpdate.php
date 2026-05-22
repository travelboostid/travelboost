<?php

namespace App\Listeners;

use App\Events\DomainUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class TriggerSslUpdate implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct() {}

    /**
     * Handle the event.
     * Processes the DomainUpdated event to trigger SSL certificate issuance via certbot when a domain is updated and enabled.
     */
    public function handle(DomainUpdated $event): void
    {
        // Skip in local
        if (app()->environment('local')) {
            return;
        }
        $domain = $event->domain;
        $original = $event->original ?? [];

        // 1. Check if domain changed
        $domainChanged = isset($original['domain'])
          && $original['domain'] !== $domain->domain;

        // 2. Check if enabled
        if (! $domainChanged || ! $domain->domain_enabled) {
            return;
        }

        try {
            Log::info("Triggering SSL for domain: {$domain->domain}");

            // 3. Run certbot
            $process = Process::fromShellCommandline(
                "sudo certbot --nginx -d {$domain->domain} --non-interactive --agree-tos -m admin@yourapp.com"
            );

            $process->run();

            if (! $process->isSuccessful()) {
                Log::error('Certbot failed: '.$process->getErrorOutput());

                return;
            }

            Log::info('Certbot success: '.$process->getOutput());

            // 4. Reload nginx
            $reload = Process::fromShellCommandline('sudo systemctl reload nginx');
            $reload->run();

            if (! $reload->isSuccessful()) {
                Log::error('Nginx reload failed: '.$reload->getErrorOutput());

                return;
            }

            Log::info('Nginx reloaded successfully');
        } catch (\Throwable $e) {
            Log::error('SSL trigger error: '.$e->getMessage());
        }
    }
}
