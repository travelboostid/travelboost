<?php

use App\Http\Controllers\Companies\AuthController;
use App\Http\Controllers\Companies\Dashboard\AgentCommissionHistoryController;
use App\Http\Controllers\Companies\Dashboard\AgentRegistrationController;
use App\Http\Controllers\Companies\Dashboard\AgentSubscriptionController;
use App\Http\Controllers\Companies\Dashboard\AgentTierController;
use App\Http\Controllers\Companies\Dashboard\AgentTourController;
use App\Http\Controllers\Companies\Dashboard\BankAccountController;
use App\Http\Controllers\Companies\Dashboard\BookingIndexController;
use App\Http\Controllers\Companies\Dashboard\BookingReportController;
use App\Http\Controllers\Companies\Dashboard\CategoryController;
use App\Http\Controllers\Companies\Dashboard\ChatbotController;
use App\Http\Controllers\Companies\Dashboard\ChatbotPaymentHistoryController;
use App\Http\Controllers\Companies\Dashboard\CommissionReportController;
use App\Http\Controllers\Companies\Dashboard\CustomerController;
use App\Http\Controllers\Companies\Dashboard\DashboardBookingController;
use App\Http\Controllers\Companies\Dashboard\GoogleAccountController;
use App\Http\Controllers\Companies\Dashboard\GoogleAnalyticsController;
use App\Http\Controllers\Companies\Dashboard\HomeController;
use App\Http\Controllers\Companies\Dashboard\LinkedAccountsController;
use App\Http\Controllers\Companies\Dashboard\NotificationController;
use App\Http\Controllers\Companies\Dashboard\PageController;
use App\Http\Controllers\Companies\Dashboard\ParameterAgentController;
use App\Http\Controllers\Companies\Dashboard\ParameterVendorController;
use App\Http\Controllers\Companies\Dashboard\PaymentController;
use App\Http\Controllers\Companies\Dashboard\PriceCategoryController;
use App\Http\Controllers\Companies\Dashboard\ProductCommissionCategoryController;
use App\Http\Controllers\Companies\Dashboard\ProfileController;
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
use App\Http\Controllers\Companies\Dashboard\TourWaitingListController;
use App\Http\Controllers\Companies\Dashboard\VendorRegistrationController;
use App\Http\Controllers\Companies\Dashboard\VendorTourCatalogController;
use App\Http\Controllers\Companies\Dashboard\VisaCategoryController;
use App\Http\Controllers\Companies\Dashboard\WaitingListController;
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
    Route::prefix('{company:username}/dashboard')->middleware(['auth', 'company.access', 'use-current-company-props'])->name('dashboard.')->group(function () {
        Route::get('/', [HomeController::class, 'index'])->name('index');

        Route::middleware(['company.permission:reports.query'])->group(function () {
            Route::get('reports/sales', [SalesReportController::class, 'index'])->name('reports.sales.index');
            Route::get('reports/commissions', [CommissionReportController::class, 'index'])->name('reports.commissions.index');
        });

        Route::middleware(['company.permission:reports.mutation'])->group(function () {
            Route::get('reports/sales/export/excel', [SalesReportController::class, 'exportExcel'])->name('reports.sales.export.excel');
            Route::get('reports/commissions/export/excel', [CommissionReportController::class, 'exportExcel'])->name('reports.commissions.export.excel');
        });

        Route::middleware(['company.permission:booking-list.query'])->group(function () {
            Route::get('reports/bookings', [BookingReportController::class, 'index'])->name('reports.bookings.index');
        });

        Route::middleware(['company.permission:booking-list.mutation'])->group(function () {
            Route::get('reports/bookings/export/excel', [BookingReportController::class, 'exportExcel'])->name('reports.bookings.export.excel');
        });

        Route::middleware(['company.permission:booking.query'])->group(function () {
            Route::get('waiting-lists', [WaitingListController::class, 'index'])->name('waiting-lists.index');
            Route::get('waiting-lists/schedules/{schedule}', [WaitingListController::class, 'showSchedule'])
                ->name('waiting-lists.schedules.show');
            Route::get('bookings', [BookingIndexController::class, 'index'])->name('bookings.index');
            Route::get('bookings/{booking}/row-actions', [BookingIndexController::class, 'rowActions'])->name('bookings.row-actions');
            Route::get('bookings/create/{tour}', [DashboardBookingController::class, 'create'])->name('bookings.create');
            Route::get('bookings/{booking}/payment-result', [DashboardBookingController::class, 'paymentResult'])->name('bookings.payment-result');
            Route::get('booking-correction', [BookingIndexController::class, 'actionRequests'])->name('booking-correction.index');
            Route::get('bookings/{booking}/reschedule-options', [BookingIndexController::class, 'rescheduleOptions'])->name('bookings.reschedule-options');
            Route::get('bookings/{booking}/invoice', [BookingIndexController::class, 'invoice'])->name('bookings.invoice');
            Route::post('bookings/{booking}/invoice-preview', [BookingIndexController::class, 'invoicePreview'])->name('bookings.invoice-preview');
            Route::get('bookings/{booking}', [BookingIndexController::class, 'show'])->name('bookings.show');
            Route::get('bookings/{booking}/edit', [BookingIndexController::class, 'edit'])->name('bookings.edit');
        });

        Route::middleware(['company.permission:booking.mutation'])->group(function () {
            Route::post('tours/{tour}/waiting-lists', [TourWaitingListController::class, 'store'])->name('tours.waiting-lists.store');
            Route::patch('waiting-lists/schedules/{schedule}/queue/reorder', [WaitingListController::class, 'reorderQueue'])
                ->name('waiting-lists.schedules.reorder');
            Route::post('waiting-lists/{waitingList}/schedules/{schedule}/offer', [WaitingListController::class, 'offerSchedule'])
                ->name('waiting-lists.schedules.offer');
            Route::patch('waiting-lists/{waitingList}/status', [WaitingListController::class, 'updateStatus'])
                ->name('waiting-lists.status.update');
            Route::post('bookings/create/{tour}/reserve', [DashboardBookingController::class, 'reserve'])->name('bookings.create.reserve');
            Route::post('bookings/create/{tour}', [DashboardBookingController::class, 'store'])->name('bookings.create.store');
            Route::post('bookings/{booking}/release-hold', [DashboardBookingController::class, 'releaseHold'])->name('bookings.release-hold');
            Route::post('bookings/{booking}/resolve-hold-expiry', [DashboardBookingController::class, 'resolveHoldExpiry'])->name('bookings.resolve-hold-expiry');
            Route::post('bookings/{booking}/travel-documents', [DashboardBookingController::class, 'updateTravelDocuments'])->name('bookings.travel-documents');
            Route::post('bookings/{booking}/manual-payment', [DashboardBookingController::class, 'storeManualPayment'])->name('bookings.manual-payment');
            Route::post('bookings/{booking}/online-payment', [DashboardBookingController::class, 'storeOnlinePayment'])->name('bookings.online-payment');
            Route::post('bookings/{booking}/online-payment/{payment}/confirm', [DashboardBookingController::class, 'confirmOnlinePayment'])->name('bookings.online-payment.confirm');
            Route::post('bookings/{booking}/reorder', [BookingIndexController::class, 'reorder'])->name('bookings.reorder');
            Route::post('booking-action-requests/{bookingActionRequest}/approve', [BookingIndexController::class, 'approveActionRequest']);
            Route::post('booking-action-requests/{bookingActionRequest}/reject', [BookingIndexController::class, 'rejectActionRequest']);
            Route::post('booking-correction/{bookingActionRequest}/approve', [BookingIndexController::class, 'approveActionRequest'])->name('booking-correction.approve');
            Route::post('booking-correction/{bookingActionRequest}/reject', [BookingIndexController::class, 'rejectActionRequest'])->name('booking-correction.reject');
            Route::post('bookings/{booking}/cancel', [BookingIndexController::class, 'cancel'])->name('bookings.cancel');
            Route::post('bookings/{booking}/refund', [BookingIndexController::class, 'refund'])->name('bookings.refund');
            Route::post('bookings/{booking}/reschedule', [BookingIndexController::class, 'reschedule'])->name('bookings.reschedule');
            Route::post('bookings/{booking}/restore', [BookingIndexController::class, 'restore'])->name('bookings.restore');
            Route::put('bookings/{booking}', [BookingIndexController::class, 'update'])->name('bookings.update');
            Route::post('bookings/{booking}/payments/{payment}/approve', [BookingIndexController::class, 'acceptManualPayment'])->name('bookings.payments.approve');
            Route::post('bookings/{booking}/payments/{payment}/decline', [BookingIndexController::class, 'declineManualPayment'])->name('bookings.payments.decline');
            Route::post('bookings/{booking}/manual-payments/{payment}/accept', [BookingIndexController::class, 'acceptManualPayment'])->name('bookings.manual-payments.accept');
            Route::post('bookings/{booking}/manual-payments/{payment}/decline', [BookingIndexController::class, 'declineManualPayment'])->name('bookings.manual-payments.decline');
        });

        Route::middleware(['company.type:vendor', 'company.permission:room-listings.query'])->group(function () {
            Route::get('reports/room-listings', [RoomListingController::class, 'index'])->name('reports.room-listings.index');
        });

        Route::middleware(['company.type:vendor', 'company.permission:room-listings.mutation'])->group(function () {
            Route::get('reports/room-listings/export/excel', [RoomListingController::class, 'exportExcel'])->name('reports.room-listings.export.excel');
            Route::get('reports/room-listings/export/pdf', [RoomListingController::class, 'exportPdf'])->name('reports.room-listings.export.pdf');
            Route::get('reports/room-listings/export/documents', [RoomListingController::class, 'exportDocuments'])->name('reports.room-listings.export.documents');
        });

        Route::middleware(['company.type:vendor', 'company.permission:seat-availability.query'])->group(function () {
            Route::get('reports/seat-availabilities', [SeatAvailabilityController::class, 'index'])->name('reports.seat-availabilities.index');
        });

        Route::group(['prefix' => 'vendors/{vendor}', 'as' => 'vendor.'], function () {
            Route::get('/tours', [VendorTourCatalogController::class, 'index'])->name('tours.index');
            Route::get('/tours/{tour}/brochure', [VendorTourCatalogController::class, 'viewBrochure'])->name('tour.view-brochure');
            Route::middleware(['company.type:agent', 'company.permission:vendor-config.query'])->get('/tours/{tour}/details', [VendorTourCatalogController::class, 'showTourDetails'])->name('tours.details');
            Route::middleware(['company.type:agent', 'agent.subscription.active', 'company.permission:vendor-config.mutation'])->post('/tours/{tour}/copy', [VendorTourCatalogController::class, 'copy'])->name('tour.copy');
        });

        Route::middleware(['company.type:vendor', 'company.permission:agents.query'])->group(function () {
            Route::get('agent-registrations/export/excel', [AgentRegistrationController::class, 'exportExcel'])->name('agent-registrations.export.excel');
            Route::get('agent-registrations/export/pdf', [AgentRegistrationController::class, 'exportPdf'])->name('agent-registrations.export.pdf');
            Route::get('agent-registrations/print', [AgentRegistrationController::class, 'print'])->name('agent-registrations.print');
        });
        Route::resource('agent-registrations', AgentRegistrationController::class)
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index'], 'company.permission:agents.query')
            ->middlewareFor(['update', 'destroy'], 'company.permission:agents.mutation');

        Route::resource('agent-tiers', AgentTierController::class)
            ->except(['create', 'show', 'edit'])
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index'], 'company.permission:commission.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:commission.mutation');

        Route::resource('product-commission-categories', ProductCommissionCategoryController::class)
            ->except(['create', 'show', 'edit'])
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index'], 'company.permission:commission.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:commission.mutation');

        Route::resource('visa-categories', VisaCategoryController::class)
            ->except(['create', 'show', 'edit'])
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index'], 'company.permission:tour-management.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:tour-management.mutation');

        Route::middleware(['company.type:vendor', 'company.permission:commission.query'])->get('tour-commission-rules/additional', [TourCommissionRuleController::class, 'additional'])->name('tour-commission-rules.additional');
        Route::middleware(['company.type:vendor', 'company.permission:commission.mutation'])->put('tour-commission-rules/additional/{additionalRule}', [TourCommissionRuleController::class, 'updateAdditional'])->name('tour-commission-rules.additional.update');
        Route::middleware(['company.type:vendor', 'company.permission:commission.mutation'])->delete('tour-commission-rules/additional/{additionalRule}', [TourCommissionRuleController::class, 'destroyAdditional'])->name('tour-commission-rules.additional.destroy');
        Route::resource('tour-commission-rules', TourCommissionRuleController::class)
            ->only(['index', 'store'])
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index'], 'company.permission:commission.query')
            ->middlewareFor(['store'], 'company.permission:commission.mutation');

        Route::middleware(['company.type:agent', 'agent.subscription.active'])->resource('vendor-registrations', VendorRegistrationController::class)
            ->middlewareFor(['index'], 'company.permission:vendor-config.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:vendor-config.mutation');
        Route::middleware(['company.type:agent', 'agent.subscription.active', 'company.permission:vendor-config.mutation'])->post('vendor-registrations/register', [VendorRegistrationController::class, 'register'])->name('vendor-registrations.register');

        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->post('tours/{tour}/notify-agents', [VendorTourCatalogController::class, 'notifyAgents'])->name('tours.notify-agents');
        Route::resource('tours', TourController::class)
            ->middleware(['company.type:vendor'])
            ->middlewareFor(['index', 'show'], 'company.permission:tour-management.query')
            ->middlewareFor(['create', 'edit', 'store', 'update', 'destroy'], 'company.permission:tour-management.mutation');
        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->delete('/tours/{tour}/schedules/{schedule}', [TourScheduleController::class, 'destroy'])->name('tours.schedules.destroy');
        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->delete('/tours/{tour}/prices/{price}', [TourPriceController::class, 'destroy'])->name('tours.prices.destroy');
        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->post('/tours/{tour}/schedules', [TourScheduleController::class, 'store'])->name('tours.schedules.store');
        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->post('tour-availabilities', [TourAvailabilityController::class, 'store'])->name('tour-availabilities.store');
        Route::middleware(['company.type:vendor', 'company.permission:tour-management.mutation'])->post('tour-add-ons', [TourAddOnController::class, 'store'])->name('tour-add-ons.store');

        Route::resource('agent-tours', AgentTourController::class)
            ->middleware(['company.type:agent'])
            ->middlewareFor(['index', 'show'], 'company.permission:tour-management.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:tour-management.mutation');

        Route::resource('categories', CategoryController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:tour-management.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:tour-management.mutation');
        Route::resource('price-categories', PriceCategoryController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:tour-management.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:tour-management.mutation');

        Route::middleware(['company.permission:funds.mutation'])->post('wallets/manual-topup', [WalletController::class, 'storeManualTopup'])->name('wallets.manual-topup');
        Route::resource('wallets', WalletController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:funds.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:funds.mutation');
        Route::resource('payments', PaymentController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:funds.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:funds.mutation');
        Route::middleware(['company.type:agent', 'company.permission:funds.query'])->get('commission-history', [AgentCommissionHistoryController::class, 'index'])->name('commission-history.index');
        Route::middleware(['company.permission:funds.mutation'])->post('payments/{payment}/cancel', [PaymentController::class, 'cancel'])->name('payments.cancel');
        Route::resource('bank-accounts', BankAccountController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:funds.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:funds.mutation');
        Route::middleware(['company.permission:funds.query'])->get('wallet-transactions', [WalletTransactionsController::class, 'index'])->name('wallet-transaction.index');
        Route::resource('withdrawals', WithdrawalController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:funds.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:funds.mutation');
        Route::middleware(['company.permission:funds.mutation'])->post('withdrawals/{withdrawal}/cancel', [WithdrawalController::class, 'cancel'])->name('withdrawals.cancel');

        Route::middleware(['company.permission:settings.query'])->get('profile', [ProfileController::class, 'show'])->name('settings.profile.show');
        Route::middleware(['company.permission:settings.query'])->get('linked-accounts', [LinkedAccountsController::class, 'index'])->name('settings.linked-accounts.index');
        Route::middleware(['company.type:vendor', 'company.permission:parameter.query'])->get('parameter-vendor', [ParameterVendorController::class, 'index'])->name('parameter-vendor.index');
        Route::middleware(['company.type:vendor', 'company.permission:parameter.mutation'])->put('parameter-vendor', [ParameterVendorController::class, 'update'])->name('parameter-vendor.update');
        Route::middleware(['company.type:agent', 'company.permission:parameter.query'])->get('parameter-agent', [ParameterAgentController::class, 'index'])->name('parameter-agent.index');
        Route::middleware(['company.type:agent', 'company.permission:parameter.mutation'])->put('parameter-agent', [ParameterAgentController::class, 'update'])->name('parameter-agent.update');
        Route::middleware(['company.permission:settings.mutation'])->put('profile', [ProfileController::class, 'update'])->name('settings.profile.update');

        Route::middleware(['company.permission:settings.mutation'])->post('teams/invite', [TeamController::class, 'invite'])->name('teams.invite');
        Route::middleware(['company.permission:settings.mutation'])->put('teams/bulk-update', [TeamController::class, 'bulkUpdate'])->name('teams.bulk-update');
        Route::middleware(['company.permission:settings.mutation'])->delete('teams/bulk-destroy', [TeamController::class, 'bulkDestroy'])->name('teams.bulk-destroy');
        Route::resource('teams', TeamController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:settings.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:settings.mutation');
        Route::middleware(['company.permission:settings.mutation'])->post('teams/{team}/resend-invitation', [TeamController::class, 'resendInvitation'])->name('teams.resend-invitation');

        Route::resource('roles', RoleController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:settings.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:settings.mutation');

        Route::middleware(['company.permission:customers.query'])->get('customers/export/excel', [CustomerController::class, 'exportExcel'])->name('customers.export.excel');
        Route::middleware(['company.permission:customers.query'])->get('customers/export/pdf', [CustomerController::class, 'exportPdf'])->name('customers.export.pdf');
        Route::middleware(['company.permission:customers.query'])->get('customers/print', [CustomerController::class, 'print'])->name('customers.print');
        Route::resource('customers', CustomerController::class)
            ->middlewareFor(['index', 'show'], 'company.permission:customers.query')
            ->middlewareFor(['store', 'update', 'destroy'], 'company.permission:customers.mutation');
        Route::middleware(['company.permission:customers.mutation'])->post('customers/{customer}/send-notification', [CustomerController::class, 'sendNotification'])->name('customers.send-notification');

        Route::middleware(['company.permission:chat-ai.mutation'])->post('chatbot/manual-topup', [ChatbotController::class, 'storeManualTopup'])->name('chatbot.manual-topup');
        Route::middleware(['company.permission:chat-ai.query'])->get('chatbot/payment-history', [ChatbotPaymentHistoryController::class, 'index'])->name('chatbot.payment-history');
        Route::singleton('chatbot', ChatbotController::class)
            ->middlewareFor(['show'], 'company.permission:chat-ai.query')
            ->middlewareFor(['update', 'store', 'destroy'], 'company.permission:chat-ai.mutation');
        Route::singleton('page', PageController::class)
            ->middleware(['company.type:agent'])
            ->middlewareFor(['show', 'edit'], 'company.permission:marketings.query')
            ->middlewareFor(['update'], 'company.permission:marketings.mutation');
        Route::singleton('agent-subscriptions', AgentSubscriptionController::class)
            ->middleware(['company.type:agent'])
            ->middlewareFor(['show'], 'company.permission:subscription-ai.query')
            ->middlewareFor(['update', 'store', 'destroy'], 'company.permission:subscription-ai.mutation');
        Route::middleware(['company.type:agent', 'company.permission:subscription-ai.mutation'])->post('agent-subscriptions/manual-payment', [AgentSubscriptionController::class, 'storeManualPayment'])->name('agent-subscriptions.manual-payment');
        Route::singleton('ai-credits', ChatbotController::class)
            ->middlewareFor(['show'], 'company.permission:chat-ai.query')
            ->middlewareFor(['update', 'store', 'destroy'], 'company.permission:chat-ai.mutation');

        Route::post('notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead'])->name('notifications.mark-all-read');
        Route::resource('notifications', NotificationController::class)->only(['index', 'update', 'destroy']);

        Route::middleware(['company.type:agent', 'company.permission:marketings.query'])->get('analytics', [GoogleAnalyticsController::class, 'index'])->name('analytics.index');
        Route::middleware(['company.type:agent', 'company.permission:marketings.query'])->get('analytics/select-or-setup-account', [GoogleAnalyticsController::class, 'showAccountSetupOrSelections'])->name('analytics.showAccountSetupOrSelections');
        Route::middleware(['company.type:agent', 'company.permission:marketings.mutation'])->get('analytics/setup-account', [GoogleAnalyticsController::class, 'setupAccount'])->name('analytics.setupAccount');
        Route::middleware(['company.type:agent', 'company.permission:marketings.mutation'])->post('analytics/select-account', [GoogleAnalyticsController::class, 'selectAccount'])->name('analytics.selectAccount');
        Route::middleware(['company.type:agent', 'company.permission:marketings.mutation'])->delete('analytics/connection', [GoogleAnalyticsController::class, 'unlinkConnection'])->name('analytics.unlinkConnection');
        Route::middleware(['company.type:agent', 'company.permission:marketings.mutation'])->get('google/connect', [GoogleAccountController::class, 'connect'])->name('google.connect');
        Route::middleware(['company.type:agent', 'company.permission:marketings.mutation'])->delete('google/disconnect', [GoogleAccountController::class, 'disconnect'])->name('google.disconnect');

        Route::get('booking-action-requests', fn (Company $company, Request $request) => redirect()->route('companies.dashboard.booking-correction.index', [
            ...$request->query(),
            'company' => $company->username,
        ], 301));
        Route::get('booking-modification-requests', fn (Company $company, Request $request) => redirect()->route('companies.dashboard.booking-correction.index', [
            ...$request->query(),
            'company' => $company->username,
        ], 301));
    });
});

Route::get(
    '/brochure/{vendor}/{tour}',
    [VendorTourCatalogController::class, 'viewPublicBrochure']
)->name('brochure.public');
