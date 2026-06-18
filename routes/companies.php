<?php

use App\Http\Controllers\Companies\AuthController;
use App\Http\Controllers\Companies\Dashboard\AdCampaignController;
use App\Http\Controllers\Companies\Dashboard\AgentRegistrationController;
use App\Http\Controllers\Companies\Dashboard\AgentSubscriptionController;
use App\Http\Controllers\Companies\Dashboard\AgentTierController;
use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\BookingIndexController;
use App\Http\Controllers\Companies\Dashboard\BookingReportController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\ChatbotController;
use App\Http\Controllers\Companies\Dashboard\CommissionReportController;
use App\Http\Controllers\Companies\Dashboard\CustomerController;
use App\Http\Controllers\Companies\Dashboard\DashboardBookingController;
use App\Http\Controllers\Companies\Dashboard\FacebookAccountController;
use App\Http\Controllers\Companies\Dashboard\GoogleAccountController;
use App\Http\Controllers\Companies\Dashboard\GoogleAnalyticsController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\LinkedAccountsController;
use App\Http\Controllers\Companies\Dashboard\MetaAnalyticsController;
use App\Http\Controllers\Companies\Dashboard\NotificationController;
use App\Http\Controllers\Companies\Dashboard\PageController;
use App\Http\Controllers\Companies\Dashboard\ParameterAgentController;
use App\Http\Controllers\Companies\Dashboard\ParameterVendorController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\PriceCategoryController;
use App\Http\Controllers\Companies\Dashboard\ProductCommissionCategoryController;
use App\Http\Controllers\Companies\Dashboard\ProfileController;
use App\Http\Controllers\Companies\Dashboard\PromotionBudgetController;
use App\Http\Controllers\Companies\Dashboard\RoleController;
use App\Http\Controllers\Companies\Dashboard\RoomListingController;
use App\Http\Controllers\Companies\Dashboard\SalesReportController;
use App\Http\Controllers\Companies\Dashboard\SeatAvailabilityController;
use App\Http\Controllers\Companies\Dashboard\TeamController;
use App\Http\Controllers\Companies\Dashboard\TourAddOnController;
use App\Http\Controllers\Companies\Dashboard\TourAvailabilityController;
use App\Http\Controllers\Companies\Dashboard\TourCommissionRuleController;
use App\Http\Controllers\Companies\Dashboard\TourController;
use App\Http\Controllers\Companies\Dashboard\TourPriceController;
use App\Http\Controllers\Companies\Dashboard\TourScheduleController;
use App\Http\Controllers\Companies\Dashboard\VendorRegistrationController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\VisaCategoryController;
use App\Http\Controllers\Companies\Dashboard\WalletController;
use App\Http\Controllers\Companies\Dashboard\WalletTransactionsController;
use App\Http\Controllers\Companies\Dashboard\WithdrawalController;
use App\Http\Controllers\Companies\IndexController;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('companies')->middleware(['can:access-company-pages', 'use-analytics-measurement-ids-props'])->name('companies.')->group(function () {
    Route::get('/', [IndexController::class, 'show'])->name('show');
    Route::middleware(['guest'])->group(function () {
        Route::get('/login', [AuthController::class, 'showLogin'])->name('login.show');
        Route::post('/login', [AuthController::class, 'login'])->name('login.store');
        Route::get('/register', [AuthController::class, 'showRegister'])->name('register.show');
        Route::post('/register', [AuthController::class, 'register'])->name('register.store');
        Route::get('/accept-team-invitation', [AuthController::class, 'showAcceptTeamInvitation'])->name('accept-team-invitation.show');
        Route::post('/accept-team-invitation', [AuthController::class, 'acceptTeamInvitation'])->name('accept-team-invitation.store');
    });
    Route::prefix('{company:username}/dashboard')->middleware(['auth', 'use-current-company-props'])->name('dashboard.')->group(function () {
        Route::get('/', [HomeController::class, 'index'])->name('index');
        Route::get('reports/room-listings', [RoomListingController::class, 'index'])->name('reports.room-listings.index');
        Route::get('reports/room-listings/export/excel', [RoomListingController::class, 'exportExcel'])->name('reports.room-listings.export.excel');
        Route::get('reports/room-listings/export/pdf', [RoomListingController::class, 'exportPdf'])->name('reports.room-listings.export.pdf');
        Route::get('reports/seat-availabilities', [SeatAvailabilityController::class, 'index'])->name('reports.seat-availabilities.index');
        Route::get('reports/sales', [SalesReportController::class, 'index'])->name('reports.sales.index');
        Route::get('reports/sales/export/excel', [SalesReportController::class, 'exportExcel'])->name('reports.sales.export.excel');
        Route::get('reports/commissions', [CommissionReportController::class, 'index'])->name('reports.commissions.index');
        Route::get('reports/commissions/export/excel', [CommissionReportController::class, 'exportExcel'])->name('reports.commissions.export.excel');
        Route::get('reports/bookings', [BookingReportController::class, 'index'])->name('reports.bookings.index');
        Route::get('reports/bookings/export/excel', [BookingReportController::class, 'exportExcel'])->name('reports.bookings.export.excel');
        Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
            Route::get('/tours', [VendorTourCatalogController::class, 'index'])->name('tours.index');
            Route::middleware(['agent.subscription.active'])->post('/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('tour.copy');
        });
        Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
            Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
        });

        Route::get('agent-registrations/export/excel', [AgentRegistrationController::class, 'exportExcel'])->name('agent-registrations.export.excel');
        Route::get('agent-registrations/export/pdf', [AgentRegistrationController::class, 'exportPdf'])->name('agent-registrations.export.pdf');
        Route::get('agent-registrations/print', [AgentRegistrationController::class, 'print'])->name('agent-registrations.print');
        Route::resource('agent-registrations', AgentRegistrationController::class);
        Route::resource('agent-tiers', AgentTierController::class)->except(['create', 'show', 'edit']);
        Route::resource('product-commission-categories', ProductCommissionCategoryController::class)->except(['create', 'show', 'edit']);
        Route::resource('visa-categories', VisaCategoryController::class)->except(['create', 'show', 'edit']);
        Route::get('tour-commission-rules/additional', [TourCommissionRuleController::class, 'additional'])->name('tour-commission-rules.additional');
        Route::put('tour-commission-rules/additional/{additionalRule}', [TourCommissionRuleController::class, 'updateAdditional'])->name('tour-commission-rules.additional.update');
        Route::delete('tour-commission-rules/additional/{additionalRule}', [TourCommissionRuleController::class, 'destroyAdditional'])->name('tour-commission-rules.additional.destroy');
        Route::resource('tour-commission-rules', TourCommissionRuleController::class)->only(['index', 'store']);
        Route::middleware(['agent.subscription.active'])->resource('vendor-registrations', VendorRegistrationController::class);
        Route::middleware(['agent.subscription.active'])->post('vendor-registrations/register', [VendorRegistrationController::class, 'register'])->name('vendor-registrations.register');
        Route::post('tours/{tour}/notify-agents', [VendorTourCatalogController::class, 'notifyAgents'])->name('tours.notify-agents');
        Route::resource('tours', TourController::class);

        Route::delete('/tours/{tour}/schedules/{schedule}', [TourScheduleController::class, 'destroy'])
            ->name('tours.schedules.destroy');

        Route::delete(
            '/tours/{tour}/prices/{price}',
            [TourPriceController::class, 'destroy']
        )->name('tours.prices.destroy');

        Route::post('/tours/{tour}/schedules', [TourScheduleController::class, 'store'])
            ->name('tours.schedules.store');

        Route::post(
            'tour-availabilities',
            [TourAvailabilityController::class, 'store']
        )->name('tour-availabilities.store');

        Route::post(
            'tour-add-ons',
            [TourAddOnController::class, 'store']
        )->name('tour-add-ons.store');

        Route::resource('agent-tours', AgentTourController::class);
        Route::resource('categories', CategoryController::class);
        Route::resource('price-categories', PriceCategoryController::class);
        Route::resource('wallets', WalletController::class);
        Route::resource('payments', PaymentController::class);
        Route::get('commission-history', [AgentCommissionHistoryController::class, 'index'])->name('commission-history.index');
        Route::post('payments/{payment}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');
        Route::resource('bank-accounts', BankAccountController::class);
        Route::get('wallet-transactions', [WalletTransactionsController::class, 'index'])->name('wallet-transaction.index');
        Route::resource('withdrawals', WithdrawalController::class);
        Route::post('withdrawals/{withdrawal}/cancel', [WithdrawalController::class, 'cancel'])->name('withdrawals.cancel');
        Route::get('profile', [ProfileController::class, 'show'])->name('settings.profile.show');
        Route::get('linked-accounts', [LinkedAccountsController::class, 'index'])->name('settings.linked-accounts.index');

        Route::get(
            'parameter-vendor',
            [ParameterVendorController::class, 'index']
        )->name('parameter-vendor.index');

        Route::put(
            'parameter-vendor',
            [ParameterVendorController::class, 'update']
        )->name('parameter-vendor.update');

        Route::get(
            'parameter-agent',
            [ParameterAgentController::class, 'index']
        )->name('parameter-agent.index');

        Route::put(
            'parameter-agent',
            [ParameterAgentController::class, 'update']
        )->name('parameter-agent.update');

        Route::put('profile', [ProfileController::class, 'update'])->name('settings.profile.update');
        Route::post('teams/invite', [TeamController::class, 'invite'])->name('teams.invite');
        Route::put('teams/bulk-update', [TeamController::class, 'bulkUpdate'])->name('teams.bulk-update');
        Route::delete('teams/bulk-destroy', [TeamController::class, 'bulkDestroy'])->name('teams.bulk-destroy');
        Route::resource('teams', TeamController::class);
        Route::post('teams/{team}/resend-invitation', [TeamController::class, 'resendInvitation'])->name('teams.resend-invitation');
        Route::resource('roles', RoleController::class);
        Route::get('customers/export/excel', [CustomerController::class, 'exportExcel'])->name('customers.export.excel');
        Route::get('customers/export/pdf', [CustomerController::class, 'exportPdf'])->name('customers.export.pdf');
        Route::get('customers/print', [CustomerController::class, 'print'])->name('customers.print');
        Route::resource('customers', CustomerController::class);
        Route::post('customers/{customer}/send-notification', [CustomerController::class, 'sendNotification'])
            ->name('customers.send-notification');
        Route::get('bookings', [BookingIndexController::class, 'index'])->name('bookings.index');
        Route::get('bookings/create/{tour}', [DashboardBookingController::class, 'create'])->name('bookings.create');
        Route::post('bookings/create/{tour}/reserve', [DashboardBookingController::class, 'reserve'])->name('bookings.create.reserve');
        Route::post('bookings/create/{tour}', [DashboardBookingController::class, 'store'])->name('bookings.create.store');
        Route::post('bookings/{booking}/release-hold', [DashboardBookingController::class, 'releaseHold'])->name('bookings.release-hold');
        Route::post('bookings/{booking}/resolve-hold-expiry', [DashboardBookingController::class, 'resolveHoldExpiry'])->name('bookings.resolve-hold-expiry');
        Route::post('bookings/{booking}/travel-documents', [DashboardBookingController::class, 'updateTravelDocuments'])->name('bookings.travel-documents');
        Route::get('bookings/{booking}/payment-result', [DashboardBookingController::class, 'paymentResult'])->name('bookings.payment-result');
        Route::post('bookings/{booking}/manual-payment', [DashboardBookingController::class, 'storeManualPayment'])->name('bookings.manual-payment');
        Route::post('bookings/{booking}/online-payment', [DashboardBookingController::class, 'storeOnlinePayment'])->name('bookings.online-payment');
        Route::post('bookings/{booking}/online-payment/{payment}/confirm', [DashboardBookingController::class, 'confirmOnlinePayment'])->name('bookings.online-payment.confirm');
        Route::post('bookings/{booking}/reorder', [BookingIndexController::class, 'reorder'])->name('bookings.reorder');
        Route::get('booking-action-requests', fn (Company $company, Request $request) => redirect()->route('companies.dashboard.booking-correction.index', [
            ...$request->query(),
            'company' => $company->username,
        ], 301));
        Route::post('booking-action-requests/{bookingActionRequest}/approve', [BookingIndexController::class, 'approveActionRequest']);
        Route::post('booking-action-requests/{bookingActionRequest}/reject', [BookingIndexController::class, 'rejectActionRequest']);
        Route::get('booking-modification-requests', fn (Company $company, Request $request) => redirect()->route('companies.dashboard.booking-correction.index', [
            ...$request->query(),
            'company' => $company->username,
        ], 301));
        Route::get('booking-correction', [BookingIndexController::class, 'actionRequests'])->name('booking-correction.index');
        Route::post('booking-correction/{bookingActionRequest}/approve', [BookingIndexController::class, 'approveActionRequest'])->name('booking-correction.approve');
        Route::post('booking-correction/{bookingActionRequest}/reject', [BookingIndexController::class, 'rejectActionRequest'])->name('booking-correction.reject');
        Route::post('bookings/{booking}/cancel', [BookingIndexController::class, 'cancel'])->name('bookings.cancel');
        Route::post('bookings/{booking}/refund', [BookingIndexController::class, 'refund'])->name('bookings.refund');
        Route::get('bookings/{booking}/invoice', [BookingIndexController::class, 'invoice'])->name('bookings.invoice');
        Route::post('bookings/{booking}/invoice-preview', [BookingIndexController::class, 'invoicePreview'])->name('bookings.invoice-preview');
        Route::get('bookings/{booking}', [BookingIndexController::class, 'show'])->name('bookings.show');
        Route::get('bookings/{booking}/edit', [BookingIndexController::class, 'edit'])->name('bookings.edit');
        Route::put('bookings/{booking}', [BookingIndexController::class, 'update'])->name('bookings.update');
        Route::post('bookings/{booking}/payments/{payment}/approve', [BookingIndexController::class, 'acceptManualPayment'])
            ->name('bookings.payments.approve');
        Route::post('bookings/{booking}/payments/{payment}/decline', [BookingIndexController::class, 'declineManualPayment'])
            ->name('bookings.payments.decline');
        Route::post('bookings/{booking}/manual-payments/{payment}/accept', [BookingIndexController::class, 'acceptManualPayment'])
            ->name('bookings.manual-payments.accept');
        Route::post('bookings/{booking}/manual-payments/{payment}/decline', [BookingIndexController::class, 'declineManualPayment'])
            ->name('bookings.manual-payments.decline');
        Route::singleton('chatbot', ChatbotController::class);
        Route::singleton('page', PageController::class);
        Route::singleton('agent-subscriptions', AgentSubscriptionController::class);

        Route::singleton('ai-credits', ChatbotController::class);

        Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::resource('notifications', NotificationController::class)->only(['index', 'update', 'destroy']);
        Route::get('analytics', [GoogleAnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('analytics/select-or-setup-account', [GoogleAnalyticsController::class, 'showAccountSetupOrSelections'])->name('analytics.showAccountSetupOrSelections');
        Route::get('analytics/setup-account', [GoogleAnalyticsController::class, 'setupAccount'])->name('analytics.setupAccount');
        Route::post('analytics/select-account', [GoogleAnalyticsController::class, 'selectAccount'])->name('analytics.selectAccount');
        Route::delete('analytics/connection', [GoogleAnalyticsController::class, 'unlinkConnection'])->name('analytics.unlinkConnection');
        Route::get('analytics/meta', [MetaAnalyticsController::class, 'index'])->name('analytics.meta.index');
        Route::singleton('marketing/budget', PromotionBudgetController::class)->names('marketing.budget');
        Route::post('marketing/budget/google/retry-provision', [PromotionBudgetController::class, 'retryGoogleAdsProvisioning'])
            ->name('marketing.budget.google.retry-provision');
        Route::post('marketing/budget/meta/retry-provision', [PromotionBudgetController::class, 'retryMetaAdsProvisioning'])
            ->name('marketing.budget.meta.retry-provision');
        Route::get('marketing/campaigns', [AdCampaignController::class, 'index'])->name('marketing.campaigns.index');
        Route::get('marketing/campaigns/create', [AdCampaignController::class, 'create'])->name('marketing.campaigns.create');
        Route::post('marketing/campaigns', [AdCampaignController::class, 'store'])->name('marketing.campaigns.store');
        Route::post('marketing/campaigns/{campaign}/pause', [AdCampaignController::class, 'pause'])->name('marketing.campaigns.pause');
        Route::get('analytics/meta/select-pixel', [MetaAnalyticsController::class, 'showPixelSelection'])->name('analytics.meta.selectPixel');
        Route::post('analytics/meta/select-pixel', [MetaAnalyticsController::class, 'selectPixel'])->name('analytics.meta.selectPixel.store');
        Route::delete('analytics/meta/connection', [MetaAnalyticsController::class, 'unlinkConnection'])->name('analytics.meta.unlinkConnection');
        Route::get('google/connect', [GoogleAccountController::class, 'connect'])->name('google.connect');
        Route::get('google/connect-ads', [GoogleAccountController::class, 'connectAds'])->name('google.connect-ads');
        Route::delete('google/disconnect', [GoogleAccountController::class, 'disconnect'])->name('google.disconnect');
        Route::get('facebook/connect', [FacebookAccountController::class, 'connect'])->name('facebook.connect');
        Route::get('facebook/connect-ads', [FacebookAccountController::class, 'connectAds'])->name('facebook.connect-ads');
        Route::delete('facebook/disconnect', [FacebookAccountController::class, 'disconnect'])->name('facebook.disconnect');
    });
});

Route::get(
    '/brochure/{vendor}/{tour}',
    [VendorTourCatalogController::class, 'viewPublicBrochure']
)->name('brochure.public');
