<?php

namespace App\Http\Controllers;

use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function showLogin(Request $request): Response
    {
        if (! session()->has('url.intended') && $request->headers->get('referer')) {
            session()->put('url.intended', $request->headers->get('referer'));
        }

        return Inertia::render('customer-auth/login');
    }

    public function showRegister(Request $request): Response
    {
        $domain = Context::get('domain');

        $affiliate = null;
        if ($domain && $domain->owner_type === AffiliateProfile::class) {
            $profile = $domain->owner;
            $user = $profile->user;
            $affiliate = [
                'id' => $profile->user_id,
                'name' => $user->name,
                'username' => $domain->subdomain,
            ];
        }

        return Inertia::render('customer-auth/register', [
            'affiliate' => $affiliate,
        ]);
    }
}
