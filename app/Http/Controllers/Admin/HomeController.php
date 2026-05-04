<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class HomeController extends Controller
{
  /**
   * Show the user's profile settings page.
   */
  public function show()
  {
    return Inertia::render('admin/home/index');
  }
}
