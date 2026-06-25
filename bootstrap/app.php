<?php

use App\Http\Middleware\CheckUserStatus;
use App\Http\Middleware\DomainResolver;
use App\Http\Middleware\EnsureAgentSubscriptionIsActive;
use App\Http\Middleware\EnsureCompanyPermission;
use App\Http\Middleware\EnsureCompanyType;
use App\Http\Middleware\EnsureHasCompanyAccess;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetAndUseAnonymousUserProps;
use App\Http\Middleware\UseAffiliateProps;
use App\Http\Middleware\UseAnalyticsMeasurementIdsProps;
use App\Http\Middleware\UseCurrentCompanyProps;
use App\Http\Middleware\UseCustomerProps;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'webhooks/*',
        ]);
        $middleware->redirectGuestsTo(function (Request $request) {
            if ($request->routeIs('verification.verify')) {
                $userId = $request->route('id');
                if ($userId) {
                    $user = User::find($userId);
                    if ($user) {
                        if ($user->hasRole('user:affiliate')) {
                            return '/affiliate/login';
                        }
                        if ($user->hasRole('user:agent') || $user->hasRole('user:vendor')) {
                            return '/companies/login';
                        }
                        if ($user->hasRole('user:customer')) {
                            return '/customers/login';
                        }
                    }
                }
            }
            if ($request->is('affiliate/*') || $request->is('affiliate')) {
                return '/affiliate/login';
            }
            if ($request->is('companies/*') || $request->is('companies')) {
                return '/companies/login';
            }
            if ($request->is('customers/*') || $request->is('customers')) {
                return '/customers/login';
            }

            return '/login';
        });
    })
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        $middleware->alias([
            'company.access' => EnsureHasCompanyAccess::class,
            'company.permission' => EnsureCompanyPermission::class,
            'company.type' => EnsureCompanyType::class,
            'agent.subscription.active' => EnsureAgentSubscriptionIsActive::class,
            'check.user.status' => CheckUserStatus::class,
            'use-affiliate-props' => UseAffiliateProps::class,
            'use-customer-props' => UseCustomerProps::class,
            'use-current-company-props' => UseCurrentCompanyProps::class,
            'set-and-use-anonymous-user-props' => SetAndUseAnonymousUserProps::class,
            'use-analytics-measurement-ids-props' => UseAnalyticsMeasurementIdsProps::class,
        ]);
        $middleware->web(append: [
            DomainResolver::class,
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
        $middleware->priority([
            DomainResolver::class,
            Authenticate::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $accessDeniedHandler = function (Throwable $e, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'This action is unauthorized.',
                ], 403);
            }

            if ($request->header('X-Inertia')) {
                $previousUrl = url()->previous();
                $currentUrl = $request->fullUrl();

                if ($previousUrl && $previousUrl !== $currentUrl) {
                    return redirect()->to($previousUrl)
                        ->with('warning', 'Your role does not have permission to access this page.')
                        ->with('error', 'Your role does not have permission to access this page.');
                }

                $company = $request->route('company');
                $companyUsername = is_object($company) ? $company->username : $company;

                if ($companyUsername) {
                    return redirect()->route('companies.dashboard.index', ['company' => $companyUsername])
                        ->with('warning', 'Your role does not have permission to access this page.')
                        ->with('error', 'Your role does not have permission to access this page.');
                }

                return redirect('/')
                    ->with('warning', 'Your role does not have permission to access this page.')
                    ->with('error', 'Your role does not have permission to access this page.');
            }

            return null;
        };

        $exceptions->render(function (AuthorizationException $e, Request $request) use ($accessDeniedHandler) {
            return $accessDeniedHandler($e, $request);
        });

        $exceptions->render(function (AccessDeniedHttpException $e, Request $request) use ($accessDeniedHandler) {
            return $accessDeniedHandler($e, $request);
        });

        $exceptions->render(function (HttpException $e, Request $request) use ($accessDeniedHandler) {
            if ($e->getStatusCode() === 403) {
                return $accessDeniedHandler($e, $request);
            }

            return null;
        });
    })->create();
