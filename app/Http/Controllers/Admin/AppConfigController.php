<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppConfig;
use Inertia\Inertia;

class AppConfigController extends Controller
{
  public function index()
  {
    $configs = AppConfig::get();
    return Inertia::render('admin/app-configs/index', [
      'data' => $configs,
    ]);
  }

  public function store()
  {
    $data = request()->validate([
      'key' => 'required|string|unique:app_configs,key',
      'description' => 'nullable|string',
      'value' => 'nullable|json',
    ]);

    AppConfig::create($data);

    return redirect()->back()->with('success', 'App Config created successfully.');
  }

  public function update(AppConfig $appConfig)
  {
    $data = request()->validate([
      'description' => 'nullable|string',
      'value' => 'nullable|array',
    ]);

    $appConfig->update($data);

    return redirect()->back()->with('success', 'App Config updated successfully.');
  }

  public function destroy(AppConfig $appConfig)
  {
    $appConfig->delete();

    return redirect()->back()->with('success', 'App Config deleted successfully.');
  }
}
