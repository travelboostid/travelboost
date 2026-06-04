<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Models\AgentTier;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AgentTierController extends Controller
{
    public function index(Company $company): Response
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        return Inertia::render('companies/dashboard/agent-tiers/index', [
            'tiers' => $company->agentTiers()
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(Request $request, Company $company): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($data['name']);
        $exists = $company->agentTiers()->where('slug', $slug)->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'This tier already exists.']);
        }

        $company->agentTiers()->create([
            'name' => $data['name'],
            'slug' => $slug,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back();
    }

    public function update(Request $request, Company $company, AgentTier $agent_tier): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($agent_tier->company_id === $company->id, 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $slug = Str::slug($data['name']);
        $exists = $company->agentTiers()
            ->where('slug', $slug)
            ->whereKeyNot($agent_tier->id)
            ->exists();

        if ($exists) {
            return back()->withErrors(['name' => 'This tier already exists.']);
        }

        $agent_tier->update([
            'name' => $data['name'],
            'slug' => $slug,
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return back();
    }

    public function destroy(Company $company, AgentTier $agent_tier): RedirectResponse
    {
        abort_unless($company->type === CompanyType::VENDOR, 403);
        abort_unless($agent_tier->company_id === $company->id, 404);

        $isUsed = $agent_tier->partners()->exists()
            || $agent_tier->commissionRules()->exists()
            || $agent_tier->additionalCommissionRules()->exists();

        if ($isUsed) {
            return back()->withErrors([
                'delete_error' => 'This tier is already used. Deactivate it instead.',
            ]);
        }

        $agent_tier->delete();

        return back();
    }
}
