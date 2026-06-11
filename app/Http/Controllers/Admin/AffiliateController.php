<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Admin\Concerns\BulkUpdatesAffiliateProfiles;
use App\Http\Controllers\Admin\Concerns\QueriesAdminAffiliateProfiles;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BulkUpdateAffiliateProfileRequest;
use App\Http\Requests\Admin\IndexAffiliateRequest;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AffiliateController extends Controller
{
    use BulkUpdatesAffiliateProfiles;
    use QueriesAdminAffiliateProfiles;

    public function index(IndexAffiliateRequest $request): Response
    {
        $validated = $request->validated();

        $query = AffiliateProfile::query()
            ->with(['user', 'upline.affiliateProfile.upline.affiliateProfile'])
            ->where('tier', 'affiliate')
            ->withCount([
                'invitedAgents as invited_agents_count',
                'subscribedAgents as subscribed_agents_count',
            ]);

        $this->applyAffiliateProfileIndexFilters($query, $validated);

        $data = $query->paginate($validated['per_page'] ?? 10);

        $data->through(fn (AffiliateProfile $profile): array => $this->affiliateRowItem($profile));

        return Inertia::render('admin/database/affiliates/index', [
            'data' => $data,
        ]);
    }

    public function bulkUpdate(BulkUpdateAffiliateProfileRequest $request)
    {
        $validated = $request->validated();

        $this->bulkUpdateAffiliateProfiles($validated);

        return back()->with('success', 'Affiliates updated successfully.');
    }

    public function exportAsCsv(Request $request)
    {
        return $this->exportAffiliateProfilesCsv($request, 'affiliates.csv');
    }
}
