<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

use App\Enums\PaymentMethodCategory;
use App\Enums\PaymentMethodStatus;
use App\Models\PaymentMethod;

function createMidtransBcaPaymentMethod(): PaymentMethod
{
    return PaymentMethod::query()->create([
        'provider' => 'midtrans',
        'method' => 'bca_va',
        'name' => 'Midtrans BCA Virtual Account',
        'description' => 'Test BCA VA',
        'category' => PaymentMethodCategory::BANK_TRANSFER,
        'status' => PaymentMethodStatus::ENABLED,
        'meta' => [
            'payment_type' => 'bank_transfer',
            'bank' => 'bca',
        ],
    ]);
}

/**
 * @param  array<string, mixed>  $overrides
 */
function mockMidtransCoreApiCharge(array $overrides = []): void
{
    Mockery::mock('alias:Midtrans\CoreApi')
        ->shouldReceive('charge')
        ->andReturn(array_merge([
            'transaction_status' => 'pending',
            'va_numbers' => [
                [
                    'bank' => 'bca',
                    'va_number' => '80777100123456',
                ],
            ],
        ], $overrides));
}
