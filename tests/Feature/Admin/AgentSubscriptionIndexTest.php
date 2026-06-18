<?php

use App\Models\AgentSubscription;
use App\Models\Company;
use App\Models\User;

beforeEach(function () {
    $this->withoutVite();

    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('admin can view subscriptions index page', function () {
    $subscription = AgentSubscription::factory()->active()->create();

    $this->actingAs($this->admin)
        ->get('/admin/database/subscriptions')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/database/subscriptions/index')
            ->has('data.data', 1)
            ->where('data.data.0.id', $subscription->id)
            ->where('data.data.0.status', 'active')
            ->where('data.data.0.company.id', $subscription->company_id));
});

test('admin can filter subscriptions by status', function () {
    $active = AgentSubscription::factory()->active()->create();
    AgentSubscription::factory()->expired()->create();

    $this->actingAs($this->admin)
        ->get('/admin/database/subscriptions?status=active')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('data.data', 1)
            ->where('data.data.0.id', $active->id));
});

test('admin can filter subscriptions by company', function () {
    $company = Company::factory()->create();
    $subscription = AgentSubscription::factory()->active()->create([
        'company_id' => $company->id,
    ]);
    AgentSubscription::factory()->active()->create();

    $this->actingAs($this->admin)
        ->get("/admin/database/subscriptions?company={$company->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('data.data', 1)
            ->where('data.data.0.id', $subscription->id));
});

test('guest cannot access subscriptions index page', function () {
    $this->get('/admin/database/subscriptions')
        ->assertRedirect();
});
