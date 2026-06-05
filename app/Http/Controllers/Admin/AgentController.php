<?php

namespace App\Http\Controllers\Admin;

use App\Enums\CompanyType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAgentRequest;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;
use Inertia\Response;

#[Authorize('access-admin-pages')]
class AgentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(IndexAgentRequest $request): Response
    {
        $validated = $request->validated();
        $data = Company::query()
            ->where('type', CompanyType::AGENT)
            ->with(['settings', 'referrer.affiliateProfile.upline.affiliateProfile.upline.affiliateProfile'])
            ->when($validated['name'] ?? null, function ($query, $name) {
                $query->where('name', 'like', "%$name%");
            })
            ->when($validated['email'] ?? null, function ($query, $email) {
                $query->where('email', 'like', "%$email%");
            })
            ->when($validated['username'] ?? null, function ($query, $username) {
                $query->where('username', 'like', "%$username%");
            })
            ->when($validated['phone'] ?? null, function ($query, $phone) {
                $query->where('phone', 'like', "%$phone%");
            })
            ->when($validated['address'] ?? null, function ($query, $address) {
                $query->where('address', 'like', "%$address%");
            })
            ->paginate();

        $data->through(fn (Company $company): array => [
            'id' => $company->id,
            'name' => $company->name,
            'username' => $company->username,
            'email' => $company->email,
            'phone' => $company->phone,
            'status' => $this->enumValue($company->status ?? 'active'),
            'created_at' => $company->created_at,
            'affiliation' => $this->resolveAffiliation($company),
        ]);

        return Inertia::render('admin/database/agents/index', [
            'data' => $data,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }

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
