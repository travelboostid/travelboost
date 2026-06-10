<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PrismaLinkCallbackController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        return redirect()->route('companies.show');
    }
}
