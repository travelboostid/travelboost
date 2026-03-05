<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyIndexRequest;
use App\Http\Requests\UpdateCompanySettingsRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UserIndexRequest;
use App\Http\Requests\VendorIndexRequest;
use App\Http\Resources\CompanyResource;
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
    $data = Company::query()
      ->when($request->input('type'), function ($q) use ($request) {
        $q->where('type', $request->input('type'));
      })
      ->paginate();
    return CompanyResource::collection($data);
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
