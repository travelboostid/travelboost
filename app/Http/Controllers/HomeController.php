<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Tenant\TourController as TenantTourController;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
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

    public function termsAndConditions(): Response
    {
        return Inertia::render('terms-and-conditions/index');
    }

    public function tours(): Response
    {
        return app(TenantTourController::class)->index();
    }
}
