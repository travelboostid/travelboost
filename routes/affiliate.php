<?php

use App\Http\Controllers\Affiliate\AgentController;
use App\Http\Controllers\Affiliate\BankAccountController;
use App\Http\Controllers\Affiliate\DashboardController;
use App\Http\Controllers\Affiliate\LandingController;
use App\Http\Controllers\Affiliate\NetworkController;
use App\Http\Controllers\Affiliate\NotificationController;
use App\Http\Controllers\Affiliate\PasswordController;
use App\Http\Controllers\Affiliate\PaymentController;
use App\Http\Controllers\Affiliate\ProfileController;
use App\Http\Controllers\Affiliate\WalletController;
use App\Http\Controllers\Affiliate\WalletTransactionsController;
use App\Http\Controllers\Affiliate\WithdrawalController;
use App\Http\Controllers\Auth\AffiliateAuthController;
use Illuminate\Support\Facades\Route;

// hapus batasan domain agar panel bisa diakses dari subdomain manapun
Route::prefix('affiliate')
    ->middleware(['use-affiliate-props', 'use-analytics-measurement-ids-props'])
    ->name('affiliate.panel.')
    ->group(function () {

        Route::get('/', [LandingController::class, 'index'])->name('landing');

        Route::middleware('guest')->group(function () {
            Route::get('/login', [AffiliateAuthController::class, 'showLogin'])->name('login');
            Route::post('/login', [AffiliateAuthController::class, 'login'])->name('login.store');

            Route::get('/register', [AffiliateAuthController::class, 'showRegister'])->name('register');
            Route::post('/register', [AffiliateAuthController::class, 'register'])->name('register.store');

            Route::get('/verify-notice', function () {
                return inertia('affiliate/auth/verify-notice');
            })->name('verify.notice');
        });

        Route::middleware('auth')->group(function () {
            Route::post('/logout', [AffiliateAuthController::class, 'logout'])->name('logout');

            Route::middleware('verified')->prefix('dashboard')->group(function () {
                Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

                Route::prefix('setup')->name('setup.')->group(function () {
                    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
                    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
                    Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
                    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
                });

                Route::prefix('network')->name('network.')->group(function () {
                    Route::get('/list', [NetworkController::class, 'index'])->name('list');
                    Route::get('/chart-data', [NetworkController::class, 'getChartData'])->name('chart');
                    Route::get('/approvals', [NetworkController::class, 'approvals'])->name('approvals');
                    Route::post('/approvals/{id}/approve', [NetworkController::class, 'approve'])->name('approve');
                    Route::post('/approvals/{id}/reject', [NetworkController::class, 'reject'])->name('reject');
                });

                Route::prefix('agent')->name('agent.')->group(function () {
                    Route::get('/list', [AgentController::class, 'index'])->name('list');
                });

                Route::prefix('fund')->name('fund.')->group(function () {
                    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet');
                    Route::get('/transactions', [WalletTransactionsController::class, 'index'])->name('transactions');
                    Route::get('/withdrawals', [WithdrawalController::class, 'index'])->name('withdrawals');
                    Route::get('/commission-history', [PaymentController::class, 'index'])->name('commission-history');
                    Route::get('/payments', [PaymentController::class, 'index'])->name('payments');

                    Route::prefix('bank-accounts')->name('bank-accounts.')->group(function () {
                        Route::get('/', [BankAccountController::class, 'index'])->name('index');
                        Route::post('/', [BankAccountController::class, 'store'])->name('store');
                        Route::put('/{bankAccount}', [BankAccountController::class, 'update'])->name('update');
                        Route::delete('/{bankAccount}', [BankAccountController::class, 'destroy'])->name('destroy');
                    });
                });

                Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
                Route::resource('notifications', NotificationController::class)->only(['index', 'update', 'destroy']);
            });
        });
    });
