<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyIndexRequest;
use App\Http\Requests\UpdateCompanySettingsRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UserIndexRequest;
use App\Http\Requests\VendorIndexRequest;
use App\Http\Resources\UserResource;
use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class CompanyController extends Controller
{
  /**
   * Display a listing of the users.
   * @operationId getCompanies
   */
  public function index(CompanyIndexRequest $request)
  {
    $query = User::query()
      ->when($request->input('search'), function ($q) use ($request) {
        $search = $request->input('search');
        $q->where(function ($q) use ($search) {
          $q->where('name', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%")
            ->orWhere('username', 'like', "%{$search}%");
        });
      });

    $vendors = $query
      ->latest()
      ->paginate($request->input('per_page', 15))
      ->appends($request->except('page'));

    return UserResource::collection($vendors);
  }

  public function showSettings(Company $company)
  {
    $company->load('settings');
    return response()->json($company->settings);
  }

  public function updateSettings(UpdateCompanySettingsRequest $request, Company $company)
  {
    $validated = $request->validated();
    $company->settings()->updateOrCreate(
      [], // one-to-one relation
      $validated
    );
    return response()->json($company->settings());
  }
}
