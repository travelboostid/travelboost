<?php

namespace App\Http\Controllers\Companies\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Companies\UpdateProfileRequest;
use App\Models\Company;
use App\Models\User;
use App\Services\AgentPackageAccessService;
use App\Support\AffiliateReferralContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function __construct(
        private readonly AgentPackageAccessService $agentPackageAccessService,
    ) {}

    public function show(Request $request, Company $company, AffiliateReferralContext $affiliateReferralContext)
    {
        $company->load(['domain', 'photo', 'identityCard', 'referrer.affiliateProfile']);

        /** @var User|null $user */
        $user = $request->user();

        $userStatus = $user ? $user->status : 'inactive';
        $statusValue = $userStatus instanceof \BackedEnum ? $userStatus->value : $userStatus;
        $referrer = $company->referrer;
        $referrerProfile = $referrer?->affiliateProfile;

        $company->setAttribute('invited_by', $referrer && ! $affiliateReferralContext->shouldHideAffiliate($referrerProfile) ? [
            'name' => $referrer->name,
            'referral_code' => $referrerProfile?->referral_code,
        ] : null);
        $company->setAttribute(
            'package_one_subdomain_access_allowed',
            $this->agentPackageAccessService->agentHasVendorAllowingPackageOneAccess($company),
        );

        return Inertia::render('companies/dashboard/profile/index', [
            'profile' => $company,
            'account_status' => strtolower((string) $statusValue),
        ]);
    }

    public function update(UpdateProfileRequest $request, Company $company): RedirectResponse
    {
        $validated = $request->validated();
        $previousUsername = $company->username;

        $updateDomainDto = Arr::only($validated, ['subdomain', 'domain', 'domain_enabled']);
        $companyDto = Arr::except($validated, ['subdomain', 'domain', 'domain_enabled']);
        $updateDomainDto['domain'] = $request->boolean('domain_enabled') ? ($updateDomainDto['domain'] ?? null) : null;
        $updateDomainDto['domain_enabled'] = filled($updateDomainDto['domain']);

        $company->forceFill($companyDto)->save();
        $company->domain()->updateOrCreate([], $updateDomainDto);
        $this->agentPackageAccessService->syncAgentSubdomainAccess($company->fresh());

        if ($company->username !== $previousUsername) {
            return redirect()
                ->route('companies.dashboard.settings.profile.show', [
                    'company' => $company->username,
                ])
                ->with('success', 'Profile updated successfully.');
        }

        return back()->with('success', 'Profile updated successfully.');
    }
}
