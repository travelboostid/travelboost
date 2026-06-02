<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\AgentIndexRequest;
use App\Models\Company;
use App\Models\VendorAgentPartner;
use App\Notifications\PaymentModeChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AgentRegistrationController extends Controller
{
    public function index(Company $company, AgentIndexRequest $request)
    {
        $validated = $request->validated();

        $data = $company->agentPartners()
            ->with([
                'agent' => function ($query) {
                    $query->with(['photo', 'identityCard']);
                },
                'agentTier',
            ])
            ->when($validated['agent.name'] ?? null, function ($query, $name) {
                $query->whereHas('agent', function ($query) use ($name) {
                    $query->where('name', 'ilike', $name.'%');
                });
            })
            ->when(request('sort'), function ($query) {
                $sorts = explode(',', request('sort'));
                foreach ($sorts as $sort) {
                    if (str_starts_with($sort, '-')) {
                        $query->orderBy(substr($sort, 1), 'desc');
                    } else {
                        $query->orderBy($sort, 'asc');
                    }
                }
            })
            ->paginate()
            ->withQueryString();

        return Inertia::render('companies/dashboard/agent-registrations/index', [
            'data' => $data,
            'agentTiers' => $company->agentTiers()
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Company $company, VendorAgentPartner $agent_registration)
    {
        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
            'agent_tier_id' => [
                'nullable',
                Rule::exists('agent_tiers', 'id')->where('company_id', $company->id),
            ],
            'show_vendor_name' => ['nullable', 'boolean'],
            'payment_mode' => ['nullable', 'in:vendor,agent'],
            'manual_payment_enabled' => ['nullable', 'boolean'],
            'online_payment_enabled' => ['nullable', 'boolean'],
        ]);

        if (isset($data['status']) && $data['status'] === 'active' && is_null($agent_registration->accepted_at)) {
            $data['accepted_at'] = now();
        }

        $agent_registration->update($data);

        if ($agent_registration->wasChanged('payment_mode')) {
            $agent_registration->agent->notify(new PaymentModeChangedNotification($agent_registration));
        }

        return back();
    }

    public function destroy(Company $company, VendorAgentPartner $agent_registration)
    {
        $agent_registration->delete();

        return back();
    }
}
