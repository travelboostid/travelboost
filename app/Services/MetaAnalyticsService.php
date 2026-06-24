<?php

namespace App\Services;

use App\Enums\MetaPixelConnectionSource;
use App\Models\Company;
use App\Models\CompanyFacebookAccount;
use App\Models\MetaPixelConnection;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class MetaAnalyticsService
{
    private const string GRAPH_API_VERSION = 'v21.0';

    public function pixelsCacheKey(Company $company): string
    {
        return "meta-pixels:{$company->id}";
    }

    public function dashboardCacheKey(MetaPixelConnection $connection): string
    {
        return "meta-dashboard:{$connection->pixel_id}:7d";
    }

    public function clearCaches(Company $company, ?MetaPixelConnection $connection = null): void
    {
        Cache::forget($this->pixelsCacheKey($company));

        if ($connection === null) {
            return;
        }

        Cache::forget($this->dashboardCacheKey($connection));
    }

    /**
     * @param  array{
     *     company_facebook_account_id?: int|null,
     *     pixel_id: string,
     *     pixel_name?: string|null,
     *     ad_account_id?: string|null,
     *     connection_source: MetaPixelConnectionSource,
     *     website_url?: string|null,
     * }  $data
     */
    public function connectPixel(Company $company, array $data): MetaPixelConnection
    {
        $existing = $company->metaPixelConnection;

        if ($existing !== null) {
            $this->clearCaches($company, $existing);
            $existing->delete();
        }

        $connection = MetaPixelConnection::create([
            'company_id' => $company->id,
            'company_facebook_account_id' => $data['company_facebook_account_id'] ?? null,
            'pixel_id' => $data['pixel_id'],
            'pixel_name' => $data['pixel_name'] ?? null,
            'ad_account_id' => $data['ad_account_id'] ?? null,
            'connection_source' => $data['connection_source'],
            'website_url' => $data['website_url'] ?? null,
        ]);

        Cache::forget($this->pixelsCacheKey($company));

        return $connection;
    }

    public function unlinkPixel(Company $company): void
    {
        $connection = $company->metaPixelConnection;

        if ($connection === null) {
            throw new RuntimeException('No Meta Pixel connection to unlink.');
        }

        $this->clearCaches($company, $connection);
        $connection->delete();
    }

    public function disconnectFacebookAccount(Company $company): void
    {
        $facebookAccount = $company->facebookAccount;

        if ($facebookAccount === null) {
            throw new RuntimeException('No Facebook account to disconnect.');
        }

        $this->clearCaches($company, $company->metaPixelConnection);
        $company->metaPixelConnection?->delete();
        $facebookAccount->delete();
    }

    /**
     * @param  object{id: string|int, email?: string|null, name?: string|null, token: string, refreshToken?: string|null, approvedScopes?: array<int, string>|null, expiresIn?: int|null}  $facebookUser
     */
    public function upsertFacebookAccount(Company $company, object $facebookUser): CompanyFacebookAccount
    {
        $existing = $company->facebookAccount;

        if ($existing !== null && (string) $existing->facebook_id !== (string) $facebookUser->id) {
            $this->clearCaches($company, $company->metaPixelConnection);
            $company->metaPixelConnection?->delete();
        }

        $expiredAt = isset($facebookUser->expiresIn)
            ? now()->addSeconds((int) $facebookUser->expiresIn)
            : null;

        return CompanyFacebookAccount::updateOrCreate(
            [
                'company_id' => $company->id,
            ],
            [
                'facebook_id' => (string) $facebookUser->id,
                'email' => $facebookUser->email ?? null,
                'name' => $facebookUser->name ?? null,
                'access_token' => $facebookUser->token,
                'refresh_token' => $facebookUser->refreshToken ?? null,
                'scopes' => $facebookUser->approvedScopes ?? null,
                'expired_at' => $expiredAt,
            ]
        );
    }

    /**
     * @return array<int, array{
     *     id: string,
     *     name: string,
     *     ad_account_id: string|null,
     * }>
     */
    public function listAvailablePixels(Company $company): array
    {
        $facebookAccount = $company->facebookAccount;

        if ($facebookAccount === null) {
            throw new RuntimeException('No Facebook account linked.');
        }

        $pixels = collect();

        $businesses = $this->graphGet(
            $facebookAccount,
            '/me/businesses',
            ['fields' => 'id,name']
        );

        foreach ($businesses as $business) {
            $businessId = (string) ($business['id'] ?? '');

            if ($businessId === '') {
                continue;
            }

            $ownedPixels = $this->graphGet(
                $facebookAccount,
                "/{$businessId}/owned_pixels",
                ['fields' => 'id,name']
            );

            foreach ($ownedPixels as $pixel) {
                $pixels->push([
                    'id' => (string) $pixel['id'],
                    'name' => (string) ($pixel['name'] ?? 'Meta Pixel'),
                    'ad_account_id' => null,
                ]);
            }
        }

        $adAccounts = $this->graphGet(
            $facebookAccount,
            '/me/adaccounts',
            ['fields' => 'id,name,account_id']
        );

        foreach ($adAccounts as $adAccount) {
            $adAccountId = (string) ($adAccount['account_id'] ?? $adAccount['id'] ?? '');

            if ($adAccountId === '') {
                continue;
            }

            $actId = str_starts_with($adAccountId, 'act_')
                ? $adAccountId
                : "act_{$adAccountId}";

            $adPixels = $this->graphGet(
                $facebookAccount,
                "/{$actId}/adspixels",
                ['fields' => 'id,name']
            );

            foreach ($adPixels as $pixel) {
                $pixels->push([
                    'id' => (string) $pixel['id'],
                    'name' => (string) ($pixel['name'] ?? 'Meta Pixel'),
                    'ad_account_id' => $actId,
                ]);
            }
        }

        return $pixels
            ->unique('id')
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     overview: array{events: int, page_views: int, unique_events: int},
     *     events: array<int, array{name: string, count: int, percentage: float}>,
     *     urls: array<int, array{name: string, count: int, percentage: float}>,
     *     devices: array<int, array{name: string, count: int, percentage: float}>,
     * }
     */
    public function getDashboardInsights(
        CompanyFacebookAccount $facebookAccount,
        MetaPixelConnection $connection
    ): array {
        $end = now();
        $start = now()->subDays(7);

        $eventStats = $this->fetchPixelStats(
            $facebookAccount,
            $connection->pixel_id,
            'event',
            $start,
            $end
        );

        $urlStats = $this->fetchPixelStats(
            $facebookAccount,
            $connection->pixel_id,
            'url',
            $start,
            $end
        );

        $deviceStats = $this->fetchPixelStats(
            $facebookAccount,
            $connection->pixel_id,
            'device_type',
            $start,
            $end
        );

        $events = $this->normalizeStats($eventStats, 'count');
        $urls = $this->normalizeStats($urlStats, 'count');
        $devices = $this->normalizeStats($deviceStats, 'count');

        $totalEvents = (int) collect($events)->sum('count');
        $pageViews = (int) collect($events)
            ->firstWhere('name', 'PageView')['count'] ?? 0;

        return [
            'overview' => [
                'events' => $totalEvents,
                'page_views' => $pageViews,
                'unique_events' => count($events),
            ],
            'events' => $events,
            'urls' => $urls,
            'devices' => $devices,
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function fetchPixelStats(
        CompanyFacebookAccount $facebookAccount,
        string $pixelId,
        string $aggregation,
        Carbon $start,
        Carbon $end
    ): array {
        try {
            $response = $this->graphGet(
                $facebookAccount,
                "/{$pixelId}/stats",
                [
                    'aggregation' => $aggregation,
                    'start_time' => $start->timestamp,
                    'end_time' => $end->timestamp,
                ]
            );

            if ($response === []) {
                return [];
            }

            $data = $response[0]['data'] ?? $response;

            return is_array($data) ? $data : [];
        } catch (RequestException $exception) {
            Log::warning('Meta Pixel stats request failed', [
                'pixel_id' => $pixelId,
                'aggregation' => $aggregation,
                'message' => $exception->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<int, array{name: string, count: int, percentage: float}>
     */
    private function normalizeStats(array $rows, string $valueKey): array
    {
        $items = collect($rows)
            ->map(function (array $row) use ($valueKey) {
                $name = (string) ($row['value'] ?? $row['event'] ?? $row['key'] ?? 'Unknown');
                $count = (int) ($row[$valueKey] ?? $row['count'] ?? 0);

                return [
                    'name' => $name,
                    'count' => $count,
                ];
            })
            ->filter(fn (array $item) => $item['count'] > 0)
            ->sortByDesc('count')
            ->values();

        $total = (int) $items->sum('count');

        return $items
            ->map(function (array $item) use ($total) {
                $item['percentage'] = $total > 0
                    ? round(($item['count'] / $total) * 100, 1)
                    : 0.0;

                return $item;
            })
            ->take(10)
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function graphGet(
        CompanyFacebookAccount $facebookAccount,
        string $path,
        array $query = []
    ): array {
        $url = $this->graphUrl($path);

        $response = Http::acceptJson()
            ->get($url, [
                ...$query,
                'access_token' => $facebookAccount->access_token,
            ])
            ->throw()
            ->json();

        return $response['data'] ?? [];
    }

    private function graphUrl(string $path): string
    {
        $normalizedPath = str_starts_with($path, '/') ? $path : "/{$path}";

        return 'https://graph.facebook.com/'.self::GRAPH_API_VERSION.$normalizedPath;
    }
}
