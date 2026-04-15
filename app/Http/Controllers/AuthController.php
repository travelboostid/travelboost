<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Request;

class AuthController extends Controller
{
  public function showLogin(Request $request): Response
  {
    return Inertia::render('auth/login');
  }

  public function showRegister(Request $request): Response
  {
    return Inertia::render('auth/register');
  }
}
