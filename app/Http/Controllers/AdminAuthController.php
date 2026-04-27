<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\Context;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\Request;

class AdminAuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    return Inertia::render('admin-auth/login');
  }
}
