<?php

use App\Actions\Booking\FinalizeBookingPaymentAction;
use App\Enums\BookingStatus;
use App\Enums\CompanyTeamStatus;
use App\Enums\UserStatus;
use App\Models\Booking;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\Tour;
use App\Models\User;
use App\Notifications\BookingDeadlineReminderNotification;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

function createDatabaseNotificationForUser(User $user, array $data): string
{
    $id = (string) Str::uuid();

    DB::table('notifications')->insert([
        'id' => $id,
        'type' => 'App\\Notifications\\BookingPaymentNotification',
        'notifiable_type' => $user->getMorphClass(),
        'notifiable_id' => $user->id,
        'data' => json_encode($data),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    return $id;
}

test('customer can list mark read mark all read and delete own notifications', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $otherUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $notificationId = createDatabaseNotificationForUser($user, [
        'title' => 'Payment submitted',
        'message' => 'Your payment proof has been submitted.',
        'type' => 'booking_payment',
    ]);
    createDatabaseNotificationForUser($otherUser, [
        'title' => 'Other',
        'message' => 'Other user notification.',
        'type' => 'booking_payment',
    ]);

    $response = $this->actingAs($user)->get('/me/notifications');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('me/notifications')
        ->has('data.data', 1)
        ->where('data.data.0.id', $notificationId));

    $this->actingAs($user)
        ->put("/me/notifications/{$notificationId}")
        ->assertRedirect();

    expect(DB::table('notifications')->where('id', $notificationId)->value('read_at'))->not->toBeNull();

    DB::table('notifications')->where('id', $notificationId)->update(['read_at' => null]);

    $this->actingAs($user)
        ->post('/me/notifications/mark-all-as-read')
        ->assertRedirect();

    expect(DB::table('notifications')->where('id', $notificationId)->value('read_at'))->not->toBeNull();

    $this->actingAs($user)
        ->delete("/me/notifications/{$notificationId}")
        ->assertRedirect();

    expect(DB::table('notifications')->where('id', $notificationId)->exists())->toBeFalse();
});

test('manual payment submission creates a customer payment notification', function () {
    Storage::fake('public');

    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], ['minimum_down_payment' => 30]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 1_000_000,
    ]);

    $this->actingAs($user)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 300_000,
        'payment_type' => 'down_payment',
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ])->assertRedirect();

    $notification = DB::table('notifications')
        ->where('notifiable_type', $user->getMorphClass())
        ->where('notifiable_id', $user->id)
        ->first();

    expect($notification)->not->toBeNull();

    $data = json_decode($notification->data, true);

    expect(data_get($data, 'type'))->toBe('booking_payment')
        ->and(data_get($data, 'stage'))->toBe('manual_payment_submitted')
        ->and(data_get($data, 'booking_id'))->toBe($booking->id);
});

test('booking finalization creates down payment and full payment customer notifications once', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'grand_total' => 1_000_000,
    ]);

    $downPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 300_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'down_payment'],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $downPayment);

    $fullPayment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 700_000,
        'status' => 'paid',
        'payload' => ['payment_type' => 'full_payment'],
        'paid_at' => now(),
    ]);

    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $fullPayment);
    app(FinalizeBookingPaymentAction::class)->execute($booking->fresh(), $fullPayment);

    $stages = DB::table('notifications')
        ->where('notifiable_type', $user->getMorphClass())
        ->where('notifiable_id', $user->id)
        ->get()
        ->map(fn ($notification) => data_get(json_decode($notification->data, true), 'stage'))
        ->all();

    expect($stages)->toContain('booking_down_payment')
        ->and($stages)->toContain('booking_full_payment')
        ->and(array_count_values($stages)['booking_full_payment'])->toBe(1);
});

test('vendor cancel booking action creates a customer notification', function () {
    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendorUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::AWAITING_PAYMENT,
        'booking_number' => 'CANCEL-NOTIFY-001',
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/cancel", [
            'reason' => 'Customer requested cancellation',
        ])
        ->assertRedirect();

    $notification = DB::table('notifications')
        ->where('notifiable_type', $customer->getMorphClass())
        ->where('notifiable_id', $customer->id)
        ->first();

    expect($notification)->not->toBeNull();

    $data = json_decode($notification->data, true);

    expect(data_get($data, 'type'))->toBe('booking_payment')
        ->and(data_get($data, 'stage'))->toBe('booking_cancelled')
        ->and(data_get($data, 'booking_id'))->toBe($booking->id);
});

test('vendor refund booking action creates a customer notification', function () {
    $customer = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendorUser = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    CompanyTeam::create([
        'company_id' => $vendor->id,
        'user_id' => $vendorUser->id,
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
        'accepted_at' => now(),
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $customer->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'booking_number' => 'REFUND-NOTIFY-001',
        'grand_total' => 1_000_000,
    ]);

    $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $customer->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 300_000,
        'status' => 'paid',
    ]);

    $this->actingAs($vendorUser)
        ->post("/companies/{$vendor->username}/dashboard/bookings/{$booking->id}/refund", [
            'reason' => 'Refund approved by vendor',
        ])
        ->assertRedirect();

    $notification = DB::table('notifications')
        ->where('notifiable_type', $customer->getMorphClass())
        ->where('notifiable_id', $customer->id)
        ->first();

    expect($notification)->not->toBeNull();

    $data = json_decode($notification->data, true);

    expect(data_get($data, 'type'))->toBe('booking_payment')
        ->and(data_get($data, 'stage'))->toBe('booking_refunded')
        ->and(data_get($data, 'booking_id'))->toBe($booking->id);
});

test('booking deadline reminder command sends due customer reminders once', function () {
    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'full_payment_deadline' => 30,
        'document_completed_deadline' => 14,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addDays(30)->toDateString(),
        'booking_number' => 'REMINDER-001',
    ]);

    Artisan::call('booking:send-deadline-reminders');
    Artisan::call('booking:send-deadline-reminders');

    $notifications = DB::table('notifications')
        ->where('notifiable_type', $user->getMorphClass())
        ->where('notifiable_id', $user->id)
        ->get();

    expect($notifications)->toHaveCount(1);
    expect(data_get(json_decode($notifications->first()->data, true), 'booking_id'))->toBe($booking->id)
        ->and(data_get(json_decode($notifications->first()->data, true), 'deadline_type'))->toBe('payment')
        ->and(data_get(json_decode($notifications->first()->data, true), 'offset'))->toBe(0);
});

test('booking deadline reminder command sends mail to booking contact email', function () {
    Notification::fake();

    $user = User::factory()->create(['status' => UserStatus::ACTIVE]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'full_payment_deadline' => 30,
        'document_completed_deadline' => 14,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addDays(30)->toDateString(),
        'booking_number' => 'REMINDER-MAIL-001',
        'contact_email' => 'booking-contact@example.test',
    ]);

    Artisan::call('booking:send-deadline-reminders');

    Notification::assertSentTo($user, BookingDeadlineReminderNotification::class);
    Notification::assertSentOnDemand(BookingDeadlineReminderNotification::class, function ($notification, array $channels, object $notifiable): bool {
        return $channels === ['mail']
            && data_get($notifiable->routes, 'mail') === 'booking-contact@example.test';
    });
});

test('booking deadline reminder command does not duplicate mail when contact email is owner email', function () {
    Notification::fake();

    $user = User::factory()->create([
        'status' => UserStatus::ACTIVE,
        'email' => 'same-contact@example.test',
    ]);
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $vendor->companySetting()->updateOrCreate([], [
        'full_payment_deadline' => 30,
        'document_completed_deadline' => 14,
    ]);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => BookingStatus::DOWN_PAYMENT,
        'departure_date' => now()->addDays(30)->toDateString(),
        'booking_number' => 'REMINDER-MAIL-002',
        'contact_email' => 'same-contact@example.test',
    ]);

    Artisan::call('booking:send-deadline-reminders');

    Notification::assertSentTo($user, BookingDeadlineReminderNotification::class);
    Notification::assertSentOnDemandTimes(BookingDeadlineReminderNotification::class, 0);
});
