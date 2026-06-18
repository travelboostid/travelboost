<?php

namespace App\Http\Middleware;

use App\Models\AppConfig;
use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
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

        $mainMeasurementId = data_get(
            AppConfig::where('key', 'common')->first()?->data,
            'google_analytics_measurement_id'
        );
        if ($mainMeasurementId) {
            $measurementIds[] = $mainMeasurementId;
        }
        /** @var Company | null */
        $tenant = Context::get('tenant');

        if ($tenant != null) {
            $tenant->loadMissing(['settings', 'googleAccount.analyticsConnection', 'metaPixelConnection']);

            if ($tenant->googleAccount?->analyticsConnection?->measurement_id) {
                $measurementIds[] = $tenant?->googleAccount?->analyticsConnection?->measurement_id;
            }
        }

        $metaPixelIds = [];

        if ($tenant?->metaPixelConnection?->pixel_id) {
            $metaPixelIds[] = $tenant->metaPixelConnection->pixel_id;
        }

        // TODO: add measurement id from travelboost
        Inertia::share([
            'analyticsMeasurementIds' => $measurementIds,
            'metaPixelIds' => $metaPixelIds,
        ]);
        View::share([
            'analyticsMeasurementIds' => $measurementIds,
            'metaPixelIds' => $metaPixelIds,
        ]);

        return $next($request);
    }
}
