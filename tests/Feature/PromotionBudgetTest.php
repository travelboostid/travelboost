<?php

use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\PaymentStatus;
use App\Enums\PromotionBudgetTransactionType;
use App\Enums\UserStatus;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\PromotionBudget;
use App\Models\PromotionBudgetTopupPayment;
use App\Models\PromotionBudgetTransaction;
use App\Models\User;
use App\Services\OnlinePaymentSettlementService;
use Database\Seeders\Common\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);

    $this->owner = User::factory()->create([
        'status' => UserStatus::ACTIVE,
    ]);

    $this->company = Company::factory()->create([
        'type' => CompanyType::AGENT,
        'username' => 'promotion-budget-company',
    ]);

    CompanyTeam::create([
        'company_id' => $this->company->id,
        'user_id' => $this->owner->id,
        'invite_email' => $this->owner->email,
        'invite_role' => "company:{$this->company->id}:superadmin",
        'invited_at' => now(),
        'accepted_at' => now(),
        'status' => CompanyTeamStatus::ACTIVE,
        'is_owner' => true,
    ]);

    $this->owner->addRoles([
        'user:agent',
        "company:{$this->company->id}:superadmin",
    ]);
});

test('new company receives a promotion budget record', function () {
    expect($this->company->promotionBudget)->not->toBeNull()
        ->and((float) $this->company->promotionBudget->balance)->toBe(0.0);
});

test('agent can view promotion budget page', function () {
    PromotionBudgetTransaction::query()->create([
        'company_id' => $this->company->id,
        'type' => PromotionBudgetTransactionType::Topup,
        'amount' => 500_000,
        'description' => 'Promotion budget top-up',
    ]);

    $response = $this->actingAs($this->owner)->get(
        "/companies/{$this->company->username}/dashboard/marketing/budget",
    );

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('companies/dashboard/marketing/budget/index')
            ->has('budget')
            ->has('pendingTopup')
            ->has('recentTransactions', 1));
});

test('paid promotion budget topup increases balance and records transaction', function () {
    $topup = PromotionBudgetTopupPayment::create([
        'amount' => 250_000,
    ]);

    $payment = $topup->payment()->create([
        'owner_id' => $this->company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 250_000,
        'status' => PaymentStatus::PAID,
    ]);

    app(OnlinePaymentSettlementService::class)->settle($payment);

    $this->company->refresh();
    $budget = PromotionBudget::query()->where('company_id', $this->company->id)->first();

    expect($budget)->not->toBeNull()
        ->and((float) $budget->balance)->toBe(250_000.0);

    expect(PromotionBudgetTransaction::query()->count())->toBe(1);

    $transaction = PromotionBudgetTransaction::query()->first();

    expect($transaction->type)->toBe(PromotionBudgetTransactionType::Topup)
        ->and((float) $transaction->amount)->toBe(250_000.0)
        ->and($transaction->reference_type)->toBe($payment->getMorphClass())
        ->and($transaction->reference_id)->toBe($payment->id);

    expect(data_get($payment->fresh()->payload, 'settled_at'))->not->toBeNull();
});

test('promotion budget topup settlement is idempotent', function () {
    $topup = PromotionBudgetTopupPayment::create([
        'amount' => 100_000,
    ]);

    $payment = $topup->payment()->create([
        'owner_id' => $this->company->id,
        'owner_type' => 'company',
        'provider' => 'midtrans',
        'payment_method' => 'bca_va',
        'amount' => 100_000,
        'status' => PaymentStatus::PAID,
    ]);

    $service = app(OnlinePaymentSettlementService::class);

    $service->settle($payment);
    $service->settle($payment->fresh());

    $budget = PromotionBudget::query()->where('company_id', $this->company->id)->first();

    expect((float) $budget->balance)->toBe(100_000.0)
        ->and(PromotionBudgetTransaction::query()->count())->toBe(1);
});

test('create promotion budget topup payment validates minimum amount', function () {
    $paymentMethod = createMidtransBcaPaymentMethod();

    $response = $this->actingAs($this->owner)->postJson(
        '/webapi/payments/create-promotion-budget-topup-payment',
        [
            'company_id' => $this->company->id,
            'amount' => 50_000,
            'payment_method_id' => $paymentMethod->id,
        ],
    );

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);
});
