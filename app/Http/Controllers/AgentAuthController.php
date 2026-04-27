<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class AgentAuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    return Inertia::render('agent-auth/login');
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
        'username' => $domain->subdomain
      ];
    }

    return Inertia::render('agent-auth/register', [
      'affiliate' => $affiliate
    ]);
  }
}
