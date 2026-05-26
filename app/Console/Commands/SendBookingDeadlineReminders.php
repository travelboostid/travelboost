<?php

namespace App\Console\Commands;

use App\Enums\BookingStatus;
use App\Models\Booking;
use App\Models\User;
use App\Notifications\BookingDeadlineReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class SendBookingDeadlineReminders extends Command
{
    protected $signature = 'booking:send-deadline-reminders';

    protected $description = 'Send customer booking payment and document deadline reminders.';

    /**
     * @var array<int, int>
     */
    private array $offsets = [30, 14, 7, 5, 3, 2, 1, 0];

    public function handle(): int
    {
        $today = CarbonImmutable::today();
        $sent = 0;

        Booking::query()
            ->with(['user', 'vendor.companySetting', 'passengers'])
            ->whereIn('status', [
                BookingStatus::DOWN_PAYMENT->value,
                BookingStatus::FULL_PAYMENT->value,
            ])
            ->chunkById(100, function ($bookings) use ($today, &$sent): void {
                foreach ($bookings as $booking) {
                    $sent += $this->sendPaymentReminderIfDue($booking, $today);
                    $sent += $this->sendDocumentReminderIfDue($booking, $today);
                }
            });

        $this->info("Sent {$sent} booking deadline reminder notification(s).");

        return self::SUCCESS;
    }

    private function sendPaymentReminderIfDue(Booking $booking, CarbonImmutable $today): int
    {
        if ($booking->status !== BookingStatus::DOWN_PAYMENT) {
            return 0;
        }

        return $this->sendReminderIfDue(
            $booking,
            'payment',
            (int) ($booking->vendor?->companySetting?->full_payment_deadline ?? 0),
            $today
        );
    }

    private function sendDocumentReminderIfDue(Booking $booking, CarbonImmutable $today): int
    {
        if (! $this->bookingNeedsTravelDocuments($booking)) {
            return 0;
        }

        return $this->sendReminderIfDue(
            $booking,
            'documents',
            (int) ($booking->vendor?->companySetting?->document_completed_deadline ?? 0),
            $today
        );
    }

    private function sendReminderIfDue(Booking $booking, string $deadlineType, int $daysBeforeDeparture, CarbonImmutable $today): int
    {
        if ($daysBeforeDeparture <= 0 || ! $booking->user instanceof User) {
            return 0;
        }

        $deadlineDate = CarbonImmutable::parse($booking->departure_date)->subDays($daysBeforeDeparture);
        $offset = (int) $today->diffInDays($deadlineDate, false);

        if (! in_array($offset, $this->offsets, true)) {
            return 0;
        }

        if ($this->reminderAlreadySent($booking, $deadlineType, $deadlineDate->toDateString(), $offset)) {
            return 0;
        }

        $booking->user->notify(new BookingDeadlineReminderNotification(
            $booking,
            $deadlineType,
            $deadlineDate,
            $offset
        ));
        $this->sendContactEmailReminder($booking, $deadlineType, $deadlineDate, $offset);

        return 1;
    }

    private function sendContactEmailReminder(Booking $booking, string $deadlineType, CarbonImmutable $deadlineDate, int $offset): void
    {
        $contactEmail = trim((string) $booking->contact_email);

        if ($contactEmail === '' || ! filter_var($contactEmail, FILTER_VALIDATE_EMAIL)) {
            return;
        }

        if ($booking->user instanceof User && strcasecmp((string) $booking->user->email, $contactEmail) === 0) {
            return;
        }

        Notification::route('mail', $contactEmail)
            ->notify(new BookingDeadlineReminderNotification(
                $booking,
                $deadlineType,
                $deadlineDate,
                $offset,
                ['mail']
            ));
    }

    private function bookingNeedsTravelDocuments(Booking $booking): bool
    {
        if ($booking->passengers->isEmpty()) {
            return false;
        }

        return $booking->passengers->contains(function ($passenger): bool {
            $category = strtolower((string) $passenger->price_category);

            if (str_contains($category, 'infant')) {
                return false;
            }

            return blank($passenger->passport_number)
                || blank($passenger->passport_issue_date)
                || blank($passenger->passport_expiry_date)
                || blank($passenger->passport_file_path)
                || blank($passenger->visa_number)
                || blank($passenger->visa_file_path);
        });
    }

    private function reminderAlreadySent(Booking $booking, string $deadlineType, string $deadlineDate, int $offset): bool
    {
        return DB::table('notifications')
            ->where('type', BookingDeadlineReminderNotification::class)
            ->where('notifiable_type', (new User)->getMorphClass())
            ->where('notifiable_id', $booking->user_id)
            ->get()
            ->contains(function (object $notification) use ($booking, $deadlineType, $deadlineDate, $offset): bool {
                $data = json_decode((string) $notification->data, true);

                if (! is_array($data)) {
                    return false;
                }

                return (int) data_get($data, 'booking_id') === (int) $booking->id
                    && data_get($data, 'deadline_type') === $deadlineType
                    && data_get($data, 'deadline_date') === $deadlineDate
                    && (int) data_get($data, 'offset') === $offset;
            });
    }
}
