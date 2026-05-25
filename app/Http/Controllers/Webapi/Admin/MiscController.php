<?php

namespace App\Http\Controllers\Webapi\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Webapi\Admin\SearchCompaniesRequest;
use App\Http\Requests\Webapi\Admin\SearchResourceOwnersRequest;
use App\Http\Resources\AffiliateProfileResource;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\SearchResourceOwnersResource;
use App\Http\Resources\UserResource;
use App\Models\AffiliateProfile;
use App\Models\Company;
use App\Models\User;

class MiscController extends Controller
{
    /**
     * Display a listing of the users.
     *
     * @operationId adminSearchCompanies
     */
    public function searchCompanies(SearchCompaniesRequest $request)
    {
        $validated = $request->validated();
        $data = Company::query()
            ->where(function ($query) use ($validated) {

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

    /**
     * Display a listing of resource owners.
     *
     * @operationId adminSearchResourceOwners
     */
    public function searchResourceOwners(SearchResourceOwnersRequest $request)
    {
        $validated = $request->validated();

        $types = [
            'user' => [
                'result_key' => 'users',
                'model' => User::class,
                'include_ids' => $validated['include_user_ids'] ?? [],
                'search' => fn ($query, $keyword) => $query
                    ->where('name', 'ilike', "%{$keyword}%"),
            ],

            'company' => [
                'result_key' => 'companies',
                'model' => Company::class,
                'include_ids' => $validated['include_company_ids'] ?? [],
                'search' => fn ($query, $keyword) => $query
                    ->where('name', 'ilike', "%{$keyword}%"),
            ],

            'affiliate' => [
                'result_key' => 'affiliates',
                'model' => AffiliateProfile::class,
                'include_ids' => $validated['include_affiliate_ids'] ?? [],
                'search' => fn ($query, $keyword) => $query
                    ->where('name', 'ilike', "%{$keyword}%"),
            ],
        ];

        $data = [];

        foreach ($validated['types'] ?? [] as $type) {
            $config = $types[$type];

            $query = $config['model']::query();

            if ($validated['keyword'] ?? null) {
                $config['search']($query, $validated['keyword']);
            }

            $items = $query
                ->limit($validated['limit'] ?? 10)
                ->get();

            if ($config['include_ids']) {
                $includedItems = $config['model']::query()
                    ->whereIn('id', $config['include_ids'])
                    ->get();

                $items = $items
                    ->merge($includedItems)
                    ->unique('id')
                    ->values();
            }

            $data[$config['result_key']] = $items;
        }

        return new SearchResourceOwnersResource([
            'users' => UserResource::collection($data['users'] ?? []),
            'companies' => CompanyResource::collection($data['companies'] ?? []),
            'affiliates' => AffiliateProfileResource::collection($data['affiliates'] ?? []),
        ]);
    }
}
