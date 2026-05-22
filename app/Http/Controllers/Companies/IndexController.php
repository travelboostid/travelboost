<?php

namespace App\Http\Controllers\Companies;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class IndexController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        if (! $user) {
            return redirect()->route('companies.login.show');
        }
        $company = $user->companies()->first();
        if (! $company) {
            return redirect()->route('me.index');
        }

        return redirect()->route('companies.dashboard.index', ['company' => $company->username]);
    }
}
