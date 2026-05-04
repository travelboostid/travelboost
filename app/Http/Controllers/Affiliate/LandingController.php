<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Inertia\Inertia;

class LandingController extends Controller
{
    // Menampilkan Landing Page Umum (Tanpa link referal)
    public function index()
    {
        return Inertia::render('affiliate/landing', [
            'isSubdomain' => false,
            'ownerName' => 'TravelBoost',
            'referralCode' => null,
        ]);
    }

    // Menampilkan Landing Page Khusus milik MA / Partner / Affiliator
    public function subdomainIndex($subdomain)
    {
        // Cari siapa pemilik link referal ini
        $profile = AffiliateProfile::where('referral_code', $subdomain)
            ->with('user')
            ->first();

        if (! $profile) {
            abort(404, 'Halaman afiliasi tidak ditemukan atau link tidak valid.');
        }

        return Inertia::render('affiliate/landing', [
            'isSubdomain' => true,
            'ownerName' => $profile->user->name,
            'referralCode' => $profile->referral_code,
            'tier' => $profile->tier,
        ]);
    }
}
