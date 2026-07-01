<?php

namespace App\Http\Controllers\Me;

use App\Enums\CompanyTeamRole;
use App\Enums\CompanyTeamStatus;
use App\Enums\CompanyType;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Me\CreateCompanyRequest;
use App\Models\AffiliateProfile;
use App\Models\AgentSubscription;
use App\Models\AgentSubscriptionPackage;
use App\Models\AppConfig;
use App\Models\Company;
use App\Models\CompanyTeam;
use App\Models\User;
use App\Notifications\AgentJoinedAffiliateNetworkNotification;
use App\Notifications\AgentOnboardingWelcomeNotification;
use App\Support\AffiliateReferralContext;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Throwable;

class OnboardingController extends Controller
{
    public function index(AffiliateReferralContext $affiliateReferralContext)
    {
        $user = Auth::user();
        $affiliate = $affiliateReferralContext->visibleAffiliatePayload();

        $invitations = CompanyTeam::where('invite_email', $user->email)
            ->where('status', CompanyTeamStatus::PENDING)
            ->with('company')
            ->get();

        return Inertia::render('me/onboarding/index', [
            'invitations' => $invitations,
            'affiliate' => $affiliate,
        ]);
    }

    public function createCompany(CreateCompanyRequest $request, AffiliateReferralContext $affiliateReferralContext)
    {
        $user = Auth::user();

        $validated = $request->validated();

        $company = DB::transaction(function () use ($user, $validated, $affiliateReferralContext): Company {
            $validatedCompanyDto = Arr::except($validated, ['subdomain']);
            $validatedCompanyDto['type'] = CompanyType::AGENT;

            $affiliate = $affiliateReferralContext->currentReferralAffiliate();
            if ($affiliate instanceof AffiliateProfile) {
                $validatedCompanyDto['referred_by'] = $affiliate->user_id;
            }

            $company = Company::forceCreate($validatedCompanyDto);

            $company->domain()->create([
                'subdomain' => $validated['subdomain'],
                'domain_enabled' => false,
                'subdomain_enabled' => false,
            ]);

            $appConfig = AppConfig::where('key', 'admin')->first();
            $adminConfig = $appConfig ? $appConfig->value : [];
            $freeAiCredit = isset($adminConfig['free_ai_credit']) ? (float) $adminConfig['free_ai_credit'] : 0;

            $company->aiCredit()->updateOrCreate([], [
                'balance' => $freeAiCredit,
            ]);

            CompanyTeam::create([
                'company_id' => $company->id,
                'user_id' => $user->id,
                'role' => CompanyTeamRole::SUPERADMIN,
                'status' => CompanyTeamStatus::ACTIVE,
                'is_owner' => true,
            ]);

            $trialPackage = AgentSubscriptionPackage::find(1);

            if ($trialPackage) {
                AgentSubscription::create([
                    'company_id' => $company->id,
                    'package_id' => $trialPackage->id,
                    'started_at' => now(),
                    'ended_at' => now()->addMonth(),
                ]);
            }

            $user->update([
                'username' => $validated['username'] ?? $user->username,
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'status' => UserStatus::ACTIVE,
            ]);

            $user->addRole("company:{$company->id}:superadmin", "company:{$company->id}");

            return $company;
        });

        $this->dispatchOnboardingNotifications($user, $company);

        return Inertia::location($this->companyDashboardUrl($request, $company));
    }

    private function dispatchOnboardingNotifications(User $user, Company $company): void
    {
        $this->notifySafely(
            $user,
            new AgentOnboardingWelcomeNotification($company, $user),
            'Unable to send agent onboarding welcome notification.',
            [
                'company_id' => $company->id,
                'user_id' => $user->id,
                'email' => $user->email,
            ],
        );

        $this->notifyAffiliateNetwork($company);
    }

    private function notifyAffiliateNetwork(Company $company): void
    {
        if (! $company->referred_by) {
            return;
        }

        $referrerProfile = AffiliateProfile::query()
            ->with(['user', 'upline.affiliateProfile.user'])
            ->where('user_id', $company->referred_by)
            ->first();

        if (! $referrerProfile) {
            return;
        }

        $affiliateProfile = $referrerProfile->tier === 'affiliate' ? $referrerProfile : null;
        $maProfile = match ($referrerProfile->tier) {
            'affiliate' => $referrerProfile->upline?->affiliateProfile,
            'master_affiliate' => $referrerProfile,
            default => null,
        };
        $partnerProfile = match ($referrerProfile->tier) {
            'affiliate' => $maProfile?->upline?->affiliateProfile,
            'master_affiliate' => $referrerProfile->upline?->affiliateProfile,
            'partner' => $referrerProfile,
            default => null,
        };

        $recipients = [
            'affiliate' => $affiliateProfile,
            'master_affiliate' => $maProfile,
            'partner' => $partnerProfile,
        ];

        foreach ($recipients as $role => $profile) {
            if (! $this->isActiveAffiliateProfile($profile)) {
                continue;
            }

            $this->notifySafely(
                $profile->user,
                new AgentJoinedAffiliateNetworkNotification(
                    company: $company,
                    affiliateProfile: $affiliateProfile,
                    maProfile: $maProfile,
                    recipientRole: $role,
                ),
                'Unable to send affiliate network onboarding notification.',
                [
                    'company_id' => $company->id,
                    'recipient_user_id' => $profile->user->id,
                    'recipient_role' => $role,
                ],
            );
        }
    }

    private function isActiveAffiliateProfile(?AffiliateProfile $profile): bool
    {
        if (! $profile?->user) {
            return false;
        }

        $profileStatus = $profile->status instanceof \BackedEnum ? $profile->status->value : $profile->status;
        $userStatus = $profile->user->status instanceof \BackedEnum ? $profile->user->status->value : $profile->user->status;

        return $profileStatus === 'approved' && $userStatus === UserStatus::ACTIVE->value;
    }

    private function companyDashboardUrl(Request $request, Company $company): string
    {
        $path = route('companies.dashboard.index', [
            'company' => $company->username,
        ], false);

        return $request->getSchemeAndHttpHost().$path;
    }

    private function notifySafely(object $notifiable, Notification $notification, string $message, array $context = []): void
    {
        try {
            $notifiable->notify($notification);
        } catch (Throwable $exception) {
            report($exception);

            Log::warning($message, [
                ...$context,
                'exception' => $exception::class,
                'message' => $exception->getMessage(),
            ]);
        }
    }

    public function acceptInvitation(Request $request, CompanyTeam $invitation)
    {
        $user = Auth::user();

        if ($invitation->invite_email !== $user->email) {
            abort(403);
        }
        if ($invitation->status !== CompanyTeamStatus::PENDING) {
            abort(400, 'Invitation invalid');
        }

        $invitation->update([
            'user_id' => $user->id,
            'status' => CompanyTeamStatus::ACTIVE,
        ]);

        $user->update([
            'status' => UserStatus::ACTIVE,
        ]);

        $user->addRole($invitation->invite_role, "company:{$invitation->company_id}");

        CompanyTeam::where('invite_email', $user->email)
            ->where('status', CompanyTeamStatus::PENDING)
            ->where('id', '!=', $invitation->id)
            ->update(['status' => CompanyTeamStatus::REJECTED]);

        return Inertia::location($this->companyDashboardUrl($request, $invitation->company));
    }

    public function declineInvitations()
    {
        $user = Auth::user();

        CompanyTeam::where('invite_email', $user->email)
            ->where('status', CompanyTeamStatus::PENDING)
            ->update(['status' => CompanyTeamStatus::REJECTED]);

        return back();
    }
}
