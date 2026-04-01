<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class CustomerRegisterController extends Controller
{
    public function show()
    {
        $tenant = request()->attributes->get('tenant');

        return Inertia::render('tenant/auth/register', [
            'company' => $tenant,
            'username' => $tenant->username,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = $request->attributes->get('tenant');

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required', 'string', 'max:255',
                'unique:customers,username,NULL,id,company_id,' . $tenant->id
            ],
            'email' => [
                'required', 'string', 'lowercase', 'email', 'max:255',
                'unique:customers,email,NULL,id,company_id,' . $tenant->id
            ],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $customer = Customer::create([
            'company_id' => $tenant->id,
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        auth()->guard('customer')->login($customer);

        return redirect('/');
    }
}