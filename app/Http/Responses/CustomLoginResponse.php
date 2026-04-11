<?php

namespace App\Http\Responses;

use Laravel\Fortify\Contracts\LoginResponse;

class CustomLoginResponse implements LoginResponse
{
    public function toResponse($request)
    {
        $user = $request->user();

        if ($user && $user->hasRole('company:0:superadmin')) {
            return redirect('/admin/dashboard');
        }

        $tenant = $request->attributes->get('tenant');

        if ($tenant != null) {
            return redirect('/');
        }
        $company = $request->user()->companies()->first();
        if ($company != null) {
            return redirect()->route('company.index', [
                'company' => $company->username,
            ]);
        }

        return redirect()->route('me.index');
    }
}
