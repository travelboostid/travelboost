<?php

namespace App\Http\Middleware;

use App\Models\AppConfig;
use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\View;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class UseAnalyticsMeasurementIdsProps
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $measurementIds = [];

        $mainMeasurementId = Cache::remember(
            'app_config:common:google_analytics_measurement_id',
            now()->addMinutes(5),
            fn (): ?string => data_get(
                AppConfig::query()->where('key', 'common')->first()?->data,
                'google_analytics_measurement_id'
            ),
        );
        if ($mainMeasurementId) {
            $measurementIds[] = $mainMeasurementId;
        }
        /** @var Company | null */
        $tenant = Context::get('tenant');

        if ($tenant != null) {
            $tenant->loadMissing(['settings', 'googleAccount.analyticsConnection']);

            if ($tenant->googleAccount?->analyticsConnection?->measurement_id) {
                $measurementIds[] = $tenant?->googleAccount?->analyticsConnection?->measurement_id;
            }
        }

        // TODO: add measurement id from travelboost
        Inertia::share([
            'analyticsMeasurementIds' => $measurementIds,
        ]);
        View::share([
            'analyticsMeasurementIds' => $measurementIds,
        ]);

        return $next($request);
    }
}
