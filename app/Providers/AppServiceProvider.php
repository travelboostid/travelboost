<?php

namespace App\Providers;

use App\Models\AffiliateProfile;
use App\Models\AgentSubscriptionPayment;
use App\Models\AiCreditTopupPayment;
use App\Models\AnonymousUser;
use App\Models\Company;
use App\Models\Media;
use App\Models\User;
use App\Models\WalletTopupPayment;
use App\Services\KnowledgeBaseService;
use App\Services\PrismaLinkService;
use App\Support\ViteAssetUrl;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Context;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(ImageManager::class, function () {
            return new ImageManager(new Driver);
        });
        $this->app->singleton(KnowledgeBaseService::class, function () {
            return new KnowledgeBaseService;
        });
        $this->app->singleton(PrismaLinkService::class, function () {
            return new PrismaLinkService;
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::createAssetPathsUsing([ViteAssetUrl::class, 'resolve']);

        Relation::morphMap([
            'wallet-topup-payment' => WalletTopupPayment::class,
            'agent-subscription-payment' => AgentSubscriptionPayment::class,
            'ai-credit-topup-payment' => AiCreditTopupPayment::class,
            'company' => Company::class,
            'user' => User::class,
            'anonymous-user' => AnonymousUser::class,
            'affiliate' => AffiliateProfile::class,
            'media' => Media::class,
        ]);
        Authenticate::redirectUsing(function ($request) {
            if ($request->expectsJson()) {
                return null; // → 401 (important for API/Inertia)
            }

            $redirectPath = '/'; // Default redirect path
            $domain = Context::get('domain');
            if ($domain == null) {
                $redirectPath = route('companies.login.show');
            } elseif ($domain->owner instanceof Company) {
                $redirectPath = route('customers.login.show');
            } elseif ($domain->owner instanceof AffiliateProfile) {
                $redirectPath = '/affiliate/login';
            } else {
                $redirectPath = '/'; // Fallback to general login if domain owner type is unrecognized
            }

            return $redirectPath;
        });

        // '?User' because the user is not always authenticated
        Gate::define('access-from-main-domain', function (?User $user) {
            $domain = Context::get('domain');

            return $domain == null;
        });
        Gate::define('access-admin-pages', function (User $user) {
            $domain = Context::get('domain');
            if ($domain != null) {
                return false;
            }

            return $user->hasRole('user:admin');
        });
        Gate::define('access-customer-pages', function (?User $user) {
            $domain = Context::get('domain');

            return $domain->owner instanceof Company;
        });
        Gate::define('access-company-pages', function (?User $user) {
            $domain = Context::get('domain');

            if ($domain == null) {
                return true;
            }

            return $domain->owner instanceof AffiliateProfile
                && request()->routeIs(
                    'companies.login.show',
                    'companies.login.store',
                    'companies.register.show',
                    'companies.register.store',
                );
        });

        $this->configureDefaults();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(
            fn (): ?Password => app()->isProduction()
              ? Password::min(12)
                  ->mixedCase()
                  ->letters()
                  ->numbers()
                  ->symbols()
                  ->uncompromised()
              : null
        );
    }
}
