<?php

namespace App\Http\Controllers\Affiliate;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class LandingController extends Controller
{
  public function index()
  {
    return Inertia::render('affiliate/landing');
  }
}
