<?php

namespace App\Http\Controllers\Admin\Concerns;

use App\Models\AffiliateProfile;
use Illuminate\Support\Facades\DB;

trait BulkUpdatesAffiliateProfiles
{
    /**
     * @param  array{ids: list<int>, status: string, note?: string|null}  $validated
     */
    protected function bulkUpdateAffiliateProfiles(array $validated): void
    {
        $profiles = AffiliateProfile::query()
            ->with('user')
            ->whereIn('id', $validated['ids'])
            ->get();

        DB::transaction(function () use ($profiles, $validated): void {
            foreach ($profiles as $profile) {
                $data = ['status' => $validated['status']];

                if ($validated['status'] === 'approved') {
                    $data['approved_at'] = now();
                }

                $profile->update($data);

                if (filled($validated['note'] ?? null) && $profile->user) {
                    $profile->user->update(['note' => $validated['note']]);
                }
            }
        });
    }
}
