<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyType;
use App\Http\Controllers\Admin\Concerns\QueriesAdminCompanies;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUpdateCompanyRequest;
use App\Http\Requests\Admin\IndexAgentRequest;
use App\Http\Requests\Admin\UpdateCompanyRequest;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AgentController extends Controller
{
    use QueriesAdminCompanies;

    public function index(IndexAgentRequest $request): Response
    {
        $validated = $request->validated();

        $query = Company::query()
            ->where('type', CompanyType::AGENT)
            ->with([
                'photo',
                'agentSubscription.package',
                'referrer.affiliateProfile.upline.affiliateProfile.upline.affiliateProfile',
            ]);

        $this->applyCompanyIndexFilters($query, $validated);

        if (! empty($validated['subscription_status'])) {
            $this->applyAgentSubscriptionStatusFilter($query, $validated['subscription_status']);
        }

        $data = $query->paginate($validated['per_page'] ?? 10);

        $data->through(function (Company $company): array {
            return [
                ...$this->companyListItem($company),
                'affiliation' => $this->resolveAffiliation($company),
            ];
        });

        return Inertia::render('admin/database/agents/index', [
            'data' => $data,
        ]);
    }

    public function edit(Company $agent): Response
    {
        abort_unless($agent->type === CompanyType::AGENT, 404);

        $agent->load(['photo', 'agentSubscription.package']);

        return Inertia::render('admin/database/agents/edit', [
            'company' => [
                ...$this->companyListItem($agent),
                'affiliation' => $this->resolveAffiliation($agent),
            ],
        ]);
    }

    public function update(UpdateCompanyRequest $request, Company $agent)
    {
        abort_unless($agent->type === CompanyType::AGENT, 404);

        $agent->update($request->validated());

        return back()->with('success', 'Agent updated successfully.');
    }

    public function bulkUpdate(BulkUpdateCompanyRequest $request)
    {
        $validated = $request->validated();
        $companies = Company::query()
            ->where('type', CompanyType::AGENT)
            ->whereIn('id', $validated['ids'])
            ->get();

        DB::transaction(function () use ($companies, $validated): void {
            foreach ($companies as $company) {
                $company->update(['note' => $validated['note']]);
            }
        });

        return back()->with('success', 'Agents updated successfully.');
    }

    public function exportAsCsv(Request $request)
    {
        return $this->exportCompaniesCsv($request, 'agents.csv');
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }

    /**
     * @return array{
     *     affiliator: array<string, mixed>|null,
     *     master_affiliate: array<string, mixed>|null,
     *     partner: array<string, mixed>|null,
     * }
     */
    private function resolveAffiliation(Company $company): array
    {
        $referrer = $company->referrer;
        $profile = $referrer?->affiliateProfile;

        if (! $referrer || ! $profile) {
            return [
                'affiliator' => null,
                'master_affiliate' => null,
                'partner' => null,
            ];
        }

        $tier = $this->normalizeTier($profile->tier);
        $affiliator = $tier === 'affiliate' ? $this->networkPerson($referrer, $profile) : null;
        $ma = null;
        $partner = null;

        if ($tier === 'affiliate') {
            $maUser = $profile->upline;
            $ma = $this->networkPerson($maUser, $maUser?->affiliateProfile);
            $partnerUser = $maUser?->affiliateProfile?->upline;
            $partner = $this->networkPerson($partnerUser, $partnerUser?->affiliateProfile);
        }

        if ($tier === 'master_affiliate') {
            $ma = $this->networkPerson($referrer, $profile);
            $partnerUser = $profile->upline;
            $partner = $this->networkPerson($partnerUser, $partnerUser?->affiliateProfile);
        }

        if ($tier === 'partner') {
            $partner = $this->networkPerson($referrer, $profile);
        }

        return [
            'affiliator' => $affiliator,
            'master_affiliate' => $ma,
            'partner' => $partner,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function networkPerson(?User $user, ?AffiliateProfile $profile): ?array
    {
        if (! $user || ! $profile) {
            return null;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'referral_code' => $profile->referral_code,
            'status' => $profile->status,
            'user_status' => $this->enumValue($user->status),
            'is_inactive' => $profile->status !== 'approved' || $this->enumValue($user->status) !== 'active',
        ];
    }

    private function normalizeTier(?string $tier): string
    {
        return str_replace('-', '_', strtolower((string) $tier));
    }

    private function enumValue(mixed $value): mixed
    {
        return $value instanceof \BackedEnum ? $value->value : $value;
    }
}
