<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAppConfigRequest;
use App\Http\Requests\Admin\UpdateAppConfigRequest;
use App\Models\AppConfig;
use Illuminate\Routing\Attributes\Controllers\Authorize;
use Inertia\Inertia;

#[Authorize('access-admin')]
class AppConfigController extends Controller
{
    public function index()
    {
        $configs = AppConfig::get();

        return Inertia::render('admin/app-configs/index', [
            'data' => $configs,
        ]);
    }

    public function store(StoreAppConfigRequest $request)
    {
        $data = $request->validated();

        AppConfig::create($data);

        return redirect()->back()->with('success', 'App Config created successfully.');
    }

    public function update(UpdateAppConfigRequest $request, AppConfig $appConfig)
    {
        $validated = $request->validated();

        $appConfig->update($validated);

        return redirect()->back()->with('success', 'App Config updated successfully.');
    }

    public function destroy(AppConfig $appConfig)
    {
        $appConfig->delete();

        return redirect()->back()->with('success', 'App Config deleted successfully.');
    }
}
