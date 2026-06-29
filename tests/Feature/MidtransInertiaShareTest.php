<?php

use App\Models\User;

test('inertia shares midtrans public config from server environment', function () {
    config([
        'midtrans.client_key' => 'SB-Mid-client-test',
        'midtrans.is_production' => false,
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/me/onboarding');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('midtrans.clientKey', 'SB-Mid-client-test')
        ->where('midtrans.isProduction', false));
});
