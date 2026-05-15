<?php

namespace App\Http\Controllers\Webapi\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Webapi\Admin\SearchCompaniesRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use Request;

class CompanyController extends Controller
{
  /**
   * Display a listing of the users.
   * @operationId adminSearchCompanies
   */
  public function searchCompanies(SearchCompaniesRequest $request)
  {
    $validated = $request->validated();
    $data = Company::query()
      ->where(function ($query) use ($request, $validated) {

        if ($validated['include_ids'] ?? null) {
          $ids = explode(',', $validated['include_ids']);

          $query->orWhereIn('id', $ids);
        }

        if ($validated['search_name'] ?? null) {
          $search = $validated['search_name'];

          $query->orWhere('name', 'ilike', "%{$search}%");
        }
      })
      ->paginate();
    return CompanyResource::collection($data);
  }
}
