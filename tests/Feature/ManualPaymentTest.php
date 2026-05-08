<?php

use App\Models\Booking;
use App\Models\Company;
use App\Models\Tour;
use App\Models\User;
use Database\Seeders\Common\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    Booking::unsetEventDispatcher();
    DB::table('continents')->insertOrIgnore(['id' => 1, 'name' => 'Asia']);
    DB::table('regions')->insertOrIgnore(['id' => 1, 'name' => 'Southeast Asia', 'continent_id' => 1]);
    DB::table('countries')->insertOrIgnore(['id' => 1, 'name' => 'Indonesia', 'continent_id' => 1, 'region_id' => 1]);
});

test('customer can submit a manual payment proof for a booking', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    $response = $this->actingAs($user)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'manual',
        'payment_method' => 'bank_transfer',
        'amount' => 500_000,
        'status' => 'pending',
    ]);

    $this->assertDatabaseHas('booking_documents', [
        'booking_id' => $booking->id,
        'type' => 'payment_proof',
        'file_name' => 'proof.jpg',
    ]);

    expect($booking->fresh()->status->value)->toBe('awaiting payment');
    expect($booking->fresh()->payment_mode)->toBe('manual');
});

test('customer cannot submit manual payment for another users booking', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $owner->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
    ]);

    $this->actingAs($otherUser)->post("/bookings/{$booking->id}/manual-payment", [
        'sender_bank_name' => 'BCA',
        'sender_account_number' => '1234567890',
        'transfer_amount' => 500_000,
        'proof' => UploadedFile::fake()->image('proof.jpg'),
    ])->assertForbidden();
});

test('manual payment sender account number must contain digits only', function () {
    Storage::fake('public');

    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
    ]);

    $response = $this->actingAs($user)
        ->from("/bookings/{$booking->id}/manual-payment")
        ->post("/bookings/{$booking->id}/manual-payment", [
            'sender_bank_name' => 'BCA',
            'sender_account_number' => 'ABC123',
            'transfer_amount' => 500_000,
            'proof' => UploadedFile::fake()->image('proof.jpg'),
        ]);

    $response->assertSessionHasErrors('sender_account_number');
});

test('customer can create an online booking payment with midtrans snap token', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'reserved',
        'grand_total' => 1_000_000,
    ]);

    \Mockery::mock('alias:Midtrans\Snap')
        ->shouldReceive('getSnapToken')
        ->once()
        ->andReturn('booking-snap-token');

    $response = $this->actingAs($user)->postJson("/bookings/{$booking->id}/online-payment", [
        'payment_type' => 'down_payment',
        'amount' => 200_000,
    ]);

    $response->assertOk()
        ->assertJsonPath('payment.payload.snap_token', 'booking-snap-token')
        ->assertJsonPath('payment.payload.payment_type', 'down_payment');

    $this->assertDatabaseHas('payments', [
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'payable_type' => Booking::class,
        'payable_id' => $booking->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 200_000,
        'status' => 'pending',
    ]);

    expect($booking->fresh()->payment_mode)->toBe('online');
});

test('midtrans webhook marks online booking payment as paid and updates booking status', function () {
    $user = User::factory()->create();
    $vendor = Company::factory()->create(['type' => 'vendor']);
    $tour = Tour::factory()->create(['company_id' => $vendor->id]);
    $booking = Booking::factory()->create([
        'user_id' => $user->id,
        'vendor_id' => $vendor->id,
        'tour_id' => $tour->id,
        'status' => 'awaiting payment',
        'payment_mode' => 'online',
    ]);

    $payment = $booking->payments()->create([
        'owner_type' => User::class,
        'owner_id' => $user->id,
        'provider' => 'midtrans',
        'payment_method' => 'snap',
        'amount' => 200_000,
        'status' => 'pending',
        'payload' => [
            'payment_type' => 'down_payment',
        ],
    ]);

    $response = $this->postJson('/webhooks/midtrans/notification', [
        'order_id' => $payment->id.'-booking',
        'transaction_status' => 'settlement',
    ]);

    $response->assertOk();

    expect($booking->fresh()->status->value)->toBe('down payment');
    expect($booking->fresh()->payment_mode)->toBe('online');
    expect($payment->fresh()->status->value)->toBe('paid');
});
