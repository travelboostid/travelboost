<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use App\Models\Domain;
use App\Models\Media;
use App\Models\User;
use App\Notifications\AffiliateReferralRegistrationNotification;
use App\Notifications\AffiliateRegistrationWelcomeNotification;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class AffiliateAuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('affiliate/auth/login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($loginType, $request->login)->first();

        if ($user) {
            $hasAffiliateProfile = AffiliateProfile::where('user_id', $user->id)->exists();
            if (! $hasAffiliateProfile) {
                return back()->withErrors([
                    'access_denied' => 'The email or username entered is not registered as an Affiliate, MA, or Partner here. Please make sure you are logging into the correct portal.',
                ])->onlyInput('login');
            }
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'login' => 'The provided credentials are incorrect.',
            ])->onlyInput('login');
        }

        $statusValue = $user->status instanceof \BackedEnum ? $user->status->value : $user->status;

        if (strtolower(trim((string) $statusValue)) === 'inactive') {
            return back()->with('account_inactive', 'Your account has been deactivated, contact the Travelboost admin at care@travelboost.co.id for further information.');
        }

        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        $profile = AffiliateProfile::where('user_id', $user->id)->first();
        if ($profile && $profile->status !== 'approved') {
            $request->session()->flash('warning', 'Your account has not been approved yet. Please complete your profile.');
        }

        return redirect()->intended('/affiliate/dashboard');
    }

    public function showRegister(Request $request)
    {
        $referralCode = null;
        $uplineName = null;

        $domainData = Context::get('domain');

        if ($domainData && $domainData->owner instanceof AffiliateProfile) {
            $referralCode = $domainData->owner->referral_code;
            $uplineName = $domainData->owner->user->name;
        }

        return Inertia::render('affiliate/auth/register', [
            'referralCode' => $referralCode,
            'uplineName' => $uplineName,
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'username' => 'required|string|max:255|unique:users,username',
            'phone' => 'required|string|max:255',
            'password' => 'required|string|confirmed|min:8',
            'referral_code' => 'nullable|string',
            'ktp_number' => 'required|numeric|digits:16',
            'identity_card_id' => 'required|exists:medias,id',
        ]);

        $uplineProfile = null;
        $uplineId = null;
        if ($request->referral_code) {
            $uplineProfile = AffiliateProfile::where('referral_code', $request->referral_code)
                ->with(['user', 'upline.affiliateProfile.user'])
                ->first();
            $uplineId = $uplineProfile ? $uplineProfile->user_id : null;
        }

        $user = null;
        $affiliate = null;

        DB::transaction(function () use ($request, $uplineId, &$user, &$affiliate) {
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'username' => $request->username,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'status' => 'active',
            ]);

            $user->addRole('user:affiliate');

            // Update the KTP media record to link it with the new user's ID
            $media = Media::find($request->identity_card_id);
            if ($media) {
                $media->update([
                    'owner_id' => $user->id,
                ]);
            }

            $affiliate = AffiliateProfile::create([
                'user_id' => $user->id,
                'upline_id' => $uplineId,
                'referral_code' => $request->username,
                'tier' => 'affiliate',
                'status' => 'pending',
                'phone' => $request->phone,
                'identity_number' => $request->ktp_number,
                'identity_card_id' => $request->identity_card_id,
            ]);

            Domain::create([
                'owner_id' => $affiliate->id,
                'owner_type' => AffiliateProfile::class,
                'subdomain' => $request->username,
                'domain_enabled' => false,
                'subdomain_enabled' => false,
            ]);
        });

        $affiliate->load('user');

        $user->notify(new AffiliateRegistrationWelcomeNotification($user, $uplineProfile));

        if ($uplineProfile && $uplineProfile->tier === 'master_affiliate' && $uplineProfile->user) {
            $uplineProfile->user->notify(
                new AffiliateReferralRegistrationNotification($affiliate, $uplineProfile, 'ma')
            );

            $partnerProfile = $uplineProfile->upline?->affiliateProfile;
            if ($partnerProfile && $partnerProfile->tier === 'partner' && $partnerProfile->user) {
                $partnerProfile->user->notify(
                    new AffiliateReferralRegistrationNotification($affiliate, $uplineProfile, 'partner')
                );
            }
        }

        event(new Registered($user));
        Auth::login($user);

        return redirect('/affiliate/verify-email');
    }

    public function uploadKtp(Request $request)
    {
        $request->validate([
            'ktp_file' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $file = $request->file('ktp_file');
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "media/documents/$filename";
        Storage::disk('public')->putFileAs('media/documents', $file, $filename);

        $media = Media::create([
            'owner_type' => User::class,
            'owner_id' => 0,
            'name' => $file->getClientOriginalName(),
            'description' => '',
            'type' => 'document',
            'subtype' => 'identity-card',
            'data' => [
                'path' => Media::publicPath($path),
                'url' => Storage::disk('public')->url($path),
                'size' => Storage::disk('public')->size($path),
                'media_type' => $file->getClientMimeType(),
            ],
        ]);

        return response()->json([
            'id' => $media->id,
            'data' => $media->data,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('');
    }
}
