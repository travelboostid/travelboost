<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;

test('main domain is not treated as invalid tenant when configuration is cached', function () {
    $appHost = 'dev.travelboost.co.id';

    putenv("APP_HOST={$appHost}");
    $_ENV['APP_HOST'] = $appHost;
    $_SERVER['APP_HOST'] = $appHost;

    Artisan::call('config:cache');

    try {
        $response = $this->get("http://{$appHost}/");

        expect($response->status())->not->toBe(404);
    } finally {
        Artisan::call('config:clear');
    }
});

test('company dashboard on subdomain redirects to configured app host not localhost', function () {
    $appHost = 'dev.travelboost.co.id';

    config(['app.host' => $appHost]);

    $user = User::factory()->create();
    Company::factory()->create([
        'username' => 'testcompany',
    ]);

    $response = $this->actingAs($user)
        ->get("http://testcompany.{$appHost}/companies/testcompany/dashboard");

    $response->assertRedirect("http://{$appHost}/companies/testcompany/dashboard");
});
