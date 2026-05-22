<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppConfig;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AppConfigAdminController extends Controller
{
    public function index()
    {
        $config = AppConfig::where('key', 'admin')->first();

        return Inertia::render(
            'admin/settings/app-config-admin/index',
            [
                'config' => $config?->value ?? [],
            ]
        );
    }

    public function update(Request $request)
    {
        $payload = collect(
            $request->except([
                '_token',
                '_method',
            ])
        )->toArray();

        AppConfig::updateOrCreate(
            [
                'key' => 'admin',
            ],
            [
                'value' => $payload,
            ]
        );

        return back()->with(
            'success',
            'Configuration updated successfully.'
        );
    }
}
