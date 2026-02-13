<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DefaultController extends Controller
{
  public function home(): Response
  {
    return Inertia::render('home/index');
  }

  public function about(): Response
  {
    return Inertia::render('about/index');
  }

  public function contact(): Response
  {
    return Inertia::render('contact/index');
  }

  public function learnMore(): Response
  {
    return Inertia::render('learn-more/index');
  }

  public function privacy(): Response
  {
    return Inertia::render('privacy/index');
  }
}
