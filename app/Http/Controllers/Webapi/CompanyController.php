<?php

namespace App\Http\Controllers\Webapi;

use App\Http\Controllers\Controller;
use App\Http\Requests\CompanyIndexRequest;
use App\Http\Requests\UpdateCompanySettingsRequest;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\CompanySettingsResource;
use App\Models\Company;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyController extends Controller
{
    /**
     * List companies with optional filters.
     *
     * @operationId getCompanies
     */
    public function index(CompanyIndexRequest $request): AnonymousResourceCollection
    {
        $data = Company::query()
            ->with(['photo'])
            ->when($request->input('ids'), function ($q) use ($request) {
                $ids = explode(',', $request->input('ids'));
                $q->whereIn('id', $ids);
            })
            ->when($request->input('search'), function ($q) use ($request) {
                $search = $request->input('search');
                $q->where(function ($query) use ($search) {
                    $query->where('name', 'ilike', "%$search%");
                });
            })
            ->when($request->input('type'), function ($q) use ($request) {
                $q->where('type', $request->input('type'));
            })
            ->paginate(15);

        return CompanyResource::collection($data);
    }

    /**
     * Get company dashboard settings.
     *
     * @operationId getCompanySettings
     */
    public function showSettings(Company $company): CompanySettingsResource
    {
        $company->load('settings');

        return new CompanySettingsResource(
            $company->settings ?? $company->settings()->make()
        );
    }

    /**
     * Update company dashboard settings.
     *
     * @operationId updateCompanySettings
     */
    public function updateSettings(UpdateCompanySettingsRequest $request, Company $company): CompanySettingsResource
    {
        $settings = $company->settings()->updateOrCreate([], $request->validated());

        return new CompanySettingsResource($settings);
    }
}
