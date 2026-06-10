<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BulkUpdatesAffiliateProfiles;
use App\Http\Controllers\Admin\Concerns\QueriesAdminAffiliateProfiles;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUpdateAffiliateProfileRequest;
use App\Http\Requests\Admin\IndexMasterAffiliateRequest;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterAffiliateController extends Controller
{
    use BulkUpdatesAffiliateProfiles;
    use QueriesAdminAffiliateProfiles;

    public function index(IndexMasterAffiliateRequest $request): Response
    {
        $validated = $request->validated();

        $query = AffiliateProfile::query()
            ->with([
                'user',
                'upline.affiliateProfile',
                'downlines' => fn ($downlineQuery) => $downlineQuery
                    ->where('tier', 'affiliate')
                    ->with('user')
                    ->orderByDesc('created_at'),
            ])
            ->whereIn('tier', ['master_affiliate', 'master-affiliate'])
            ->withCount([
                'downlines as invited_affiliates_count' => fn ($downlineQuery) => $downlineQuery->where('tier', 'affiliate'),
            ]);

        $this->applyAffiliateProfileIndexFilters($query, $validated);

        $data = $query->paginate($validated['per_page'] ?? 10);

        $data->through(fn (AffiliateProfile $profile): array => $this->masterAffiliateRowItem($profile));

        return Inertia::render('admin/database/master-affiliates/index', [
            'data' => $data,
        ]);
    }

    public function bulkUpdate(BulkUpdateAffiliateProfileRequest $request)
    {
        $validated = $request->validated();

        $this->bulkUpdateAffiliateProfiles($validated);

        return back()->with('success', 'Master affiliates updated successfully.');
    }

    public function exportAsCsv(Request $request)
    {
        return $this->exportAffiliateProfilesCsv($request, 'master-affiliates.csv');
    }
}
