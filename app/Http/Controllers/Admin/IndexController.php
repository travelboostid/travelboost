<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Illuminate\Support\Facades\Auth;

#[Authorize('access-admin')]
class IndexController extends Controller
{
    public function show()
    {
        $user = Auth::user();
        if (! $user) {
            return redirect()->route('admin.login.show');
        }
        if (! $user->hasRole('user:admin')) {
            return redirect()->route('index');
        }

        return redirect()->route('admin.dashboard');
    }
}
