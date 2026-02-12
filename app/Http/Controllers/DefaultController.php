<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DefaultController extends Controller
{
  public function home(): Response
  {
    return Inertia::render('home', ["x" => 2]);
  }

  public function about(): Response
  {
    return Inertia::render('about');
  }

  public function contact(): Response
  {
    return Inertia::render('contact');
  }

  public function learnMore(): Response
  {
    return Inertia::render('learn-more');
  }

  public function privacy(): Response
  {
    return Inertia::render('privacy');
  }
}
