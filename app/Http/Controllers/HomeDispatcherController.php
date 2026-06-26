<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Affiliate\LandingController as AffiliateHomeController;
use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\Tenant\HomeController as TenantHomeController;
use App\Http\Middleware\SetAndUseAnonymousUserProps;
use App\Http\Middleware\UseAffiliateProps;
use App\Http\Middleware\UseAnalyticsMeasurementIdsProps;
use App\Http\Middleware\UseCustomerProps;
use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Illuminate\Pipeline\Pipeline;
use Illuminate\Support\Facades\Context;

class HomeDispatcherController extends Controller
{
    /**
     * Route targets for the "/" endpoint.
     *
     * We intentionally dispatch controllers manually because multiple
     * homepage variants share the same URL ("/") and are selected at
     * runtime based on the resolved domain/tenant context.
     *
     * Each target can define its own middleware pipeline before the
     * controller action is executed.
     */
    private array $homes = [
        'main' => [
            'middlewares' => [],
            'action' => [BaseHomeController::class, 'index'],
        ],

        'affiliate' => [
            'middlewares' => [UseAffiliateProps::class],
            'action' => [AffiliateHomeController::class, 'index'],
        ],

        'customer' => [
            'middlewares' => [UseCustomerProps::class, SetAndUseAnonymousUserProps::class, UseAnalyticsMeasurementIdsProps::class],
            'action' => [TenantHomeController::class, 'index'],
        ],
    ];

    public function __invoke(Request $request)
    {
        $affiliateBaseUrl = 'affiliate.'.config('app.host', 'localhost');

        // Determine which homepage variant should handle this request.
        $type = match (true) {
            $affiliateBaseUrl === $request->getHost() => 'affiliate',
            Context::get('tenant') !== null => 'customer',
            $this->usesAffiliateLanding(Context::get('affiliate')) => 'affiliate',
            default => 'main',
        };

        $target = $this->homes[$type];

        [$controller, $method] = $target['action'];

        return app(Pipeline::class)
            ->send($request)

            // Execute middleware specific to the selected homepage.
            ->through($target['middlewares'])

            // Resolve controller through the container so action
            // dependencies are injected normally.
            ->then(fn () => app()->call([
                app($controller),
                $method,
            ]));
    }

    private function usesAffiliateLanding(?AffiliateProfile $affiliate): bool
    {
        return $affiliate !== null && in_array($affiliate->tier, ['master_affiliate', 'master-affiliate', 'partner'], true);
    }
}
