<?php

use App\Http\Controllers\BookingController;
use App\Http\Controllers\CaddyController;
use App\Http\Controllers\Google\GoogleAuthController;
use App\Http\Controllers\HomeController as BaseHomeController;
use App\Http\Controllers\HomeDispatcherController;
use App\Http\Controllers\Me\HomeController as MeHomeController;
use App\Http\Controllers\Me\Settings\ProfileController as MeProfileController;
use App\Http\Controllers\Me\Settings\TwoFactorAuthenticationController as MeTwoFactorAuthenticationController;
use App\Http\Controllers\Webhooks\MidtransWebhookController;
use App\Http\Middleware\DomainResolver;
use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Laravolt\Indonesia\Models\City;
use Laravolt\Indonesia\Models\District;
use Laravolt\Indonesia\Models\Province;
use Laravolt\Indonesia\Models\Village;

Route::get('/', HomeDispatcherController::class)->name('index');
Route::get('/home', [BaseHomeController::class, 'index'])->name('home');
Route::get('/about', [BaseHomeController::class, 'about'])->name('about');
Route::get('/contact', [BaseHomeController::class, 'contact'])->name('contact');
Route::get('/learn-more', [BaseHomeController::class, 'learnMore'])->name('learn-more');
Route::get('/privacy', [BaseHomeController::class, 'privacy'])->name('privacy');
Route::get('/terms-and-conditions', [BaseHomeController::class, 'termsAndConditions'])->name('terms-and-conditions');
Route::get('/tours', [BaseHomeController::class, 'tours'])->name('tours');

Route::middleware('guest')->group(function () {
    Route::get('/login', function () {
        return Inertia::render('auth/login');
    })->name('login');

    Route::post('/login', function (Request $request) {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (Auth::attempt($validated, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'));
        }

        return back()->withErrors([
            'email' => __('auth.failed'),
        ])->onlyInput('email');
    })->name('login.store');

    Route::get('/register', function () {
        return Inertia::render('auth/register');
    })->name('register');

    Route::post('/register', function (Request $request) {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', 'min:8'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'username' => Str::slug($validated['name']).'-'.Str::lower(Str::random(6)),
            'password' => Hash::make($validated['password']),
            'status' => 'active',
            'email_verified_at' => now(),
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    })->name('register.store');

    Route::get('/forgot-password', function () {
        return Inertia::render('auth/forgot-password');
    })->name('password.request');

    Route::post('/forgot-password', function (Request $request) {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        Password::sendResetLink($request->only('email'));

        return back()->with('status', 'password-reset-link-sent');
    })->name('password.email');

    Route::get('/reset-password/{token}', function (string $token, Request $request) {
        return Inertia::render('auth/reset-password', [
            'token' => $token,
            'email' => $request->query('email'),
        ]);
    })->name('password.reset');

    Route::post('/reset-password', function (Request $request) {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'confirmed', 'min:8'],
        ]);

        $status = Password::reset(
            $validated,
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    })->name('password.update');

    Route::get('/confirm-password', function () {
        return Inertia::render('auth/confirm-password');
    })->name('password.confirm');

    Route::get('/verify-email', function (Request $request) {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]);
    })->middleware('auth')->name('verification.notice');

    Route::post('/email/verification-notification', function (Request $request) {
        if ($request->user()?->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $request->user()?->sendEmailVerificationNotification();

        return back()->with('status', 'verification-link-sent');
    })->middleware('auth')->name('verification.send');

    Route::get('/verify-email/{id}/{hash}', function (Request $request) {
        $user = $request->user();

        abort_unless($user, 403);
        abort_unless(hash_equals((string) $request->route('id'), (string) $user->getKey()), 403);
        abort_unless(hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification())), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        return redirect()->route('dashboard').'?verified=1';
    })->middleware(['auth', 'signed'])->name('verification.verify');

    Route::get('/two-factor-challenge', function (Request $request) {
        if (! $request->session()->has('login.id')) {
            return redirect()->route('login');
        }

        return Inertia::render('auth/two-factor-challenge');
    })->name('two-factor.login');
});

Route::post('/logout', function (Request $request) {
    Auth::logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return redirect()->route('home');
})->middleware('auth')->name('logout');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [MeHomeController::class, 'show'])->name('dashboard');
    Route::get('/profile', [MeProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [MeProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [MeProfileController::class, 'destroy'])->name('profile.destroy');
    Route::get('/two-factor', [MeTwoFactorAuthenticationController::class, 'show'])->name('two-factor.show');
    Route::get('/password/confirm', function () {
        return Inertia::render('auth/confirm-password');
    })->name('password.confirm');
    Route::get('/mybookings/{booking}/invoice', [MeHomeController::class, 'bookingInvoice'])
        ->name('home.bookings.invoice');

    Route::post('/bookings/{booking}/reorder', [BookingController::class, 'reorder'])
        ->name('customer.bookings.reorder');
    Route::post('/bookings/{booking}/release-hold', [BookingController::class, 'releaseHold'])
        ->name('customer.bookings.release-hold');
    Route::put('/bookings/{booking}', [BookingController::class, 'update'])
        ->name('customer.bookings.update');
    Route::post('/bookings/{booking}/travel-documents', [BookingController::class, 'updateTravelDocuments'])
        ->name('customer.bookings.travel-documents');
    Route::get('/bookings/{booking}/payment-result', [BookingController::class, 'paymentResult'])
        ->name('customer.bookings.payment-result');
    Route::post('/bookings/{booking}/manual-payment', [BookingController::class, 'storeManualPayment'])
        ->name('customer.bookings.manual-payment');
    Route::post('/bookings/{booking}/online-payment', [BookingController::class, 'storeOnlinePayment'])
        ->name('customer.bookings.online-payment');
    Route::post('/bookings/{booking}/online-payment/{payment}/confirm', [BookingController::class, 'confirmOnlinePayment'])
        ->name('customer.bookings.online-payment.confirm');
});

Route::prefix('webhooks')->group(function () {
    Route::middleware(['web'])->group(function () {
        Route::post('midtrans/notification', [MidtransWebhookController::class, 'handleNotification']);
    });
});

Route::prefix('api/regions')->group(function () {
    Route::get('provinces', fn () => response()->json(Province::orderBy('name')->get()));
    Route::get('cities/{province}', fn ($province) => response()->json(City::where('province_code', $province)->orderBy('name')->get()));
    Route::get('districts/{city}', fn ($city) => response()->json(District::where('city_code', $city)->orderBy('name')->get()));
    Route::get('villages/{district}', fn ($district) => response()->json(Village::where('district_code', $district)->orderBy('name')->get()));
});
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);
Route::get('/caddy/verify-domain', [CaddyController::class, 'verifyDomain'])->withoutMiddleware([
    DomainResolver::class,
]);
