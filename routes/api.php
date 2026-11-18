<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\B2BRegistrationController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\QuoteSettingsController;
use App\Http\Controllers\API\B2BQuoteController;
use App\Http\Controllers\API\B2BTranslationController;
use App\Http\Controllers\API\B2BOrderingController;
use App\Http\Controllers\API\B2BShoppingListController;
use App\Http\Controllers\API\B2BCompanyMemberController;
use App\Http\Controllers\API\B2BCreditFinanceController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
|*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('verify.shopify.token')->group(function () {
    // B2B registration endpoint with 6 requests per minute per IP rate limiting
    Route::post('/b2b/register', [B2BRegistrationController::class, 'register'])
        ->middleware('throttle:6,1');

    // B2B admin applications management routes
    Route::get('/b2b/applications', [B2BRegistrationController::class, 'index']);
    Route::get('/b2b/applications/{id}', [B2BRegistrationController::class, 'show']);
    Route::get('/b2b/applications/{id}/document', [B2BRegistrationController::class, 'downloadDocument']);
    Route::post('/b2b/applications/{id}/approve', [B2BRegistrationController::class, 'approve']);
    Route::post('/b2b/applications/{id}/reject', [B2BRegistrationController::class, 'reject']);

    // B2B admin subscriptions pricing management routes
    Route::get('/b2b/subscriptions', [B2BRegistrationController::class, 'getSubscriptions']);
    Route::get('/b2b/shop-plan', [B2BRegistrationController::class, 'getShopPlan']);
    Route::post('/b2b/shop-plan/update', [B2BRegistrationController::class, 'updateShopPlan']);

    // B2B quote settings routes
    Route::get('/b2b/quote-settings', [QuoteSettingsController::class, 'getSettings']);
    Route::post('/b2b/quote-settings/update', [QuoteSettingsController::class, 'updateSettings'])->middleware('check.b2b.subscription:quote');

    // B2B notification settings routes
    Route::get('/b2b/notification-settings', [B2BRegistrationController::class, 'getNotificationSettings']);
    Route::post('/b2b/notification-settings/update', [B2BRegistrationController::class, 'updateNotificationSetting']);

    // B2B registration form configuration routes
    Route::get('/b2b/form-config', [B2BRegistrationController::class, 'getFormConfig']);
    Route::post('/b2b/form-config/update', [B2BRegistrationController::class, 'updateFormConfig']);

    // B2B quotes CRUD routes
    Route::get('/b2b/quotes', [B2BQuoteController::class, 'index']);
    Route::get('/b2b/quotes/{id}', [B2BQuoteController::class, 'show']);
    Route::post('/b2b/quotes', [B2BQuoteController::class, 'store'])->middleware('check.b2b.subscription:quote');
    Route::post('/b2b/quotes/{id}/update', [B2BQuoteController::class, 'update'])->middleware('throttle:30,1');
    Route::post('/b2b/quotes/{id}/send', [B2BQuoteController::class, 'send'])->middleware('check.b2b.subscription:quote');

    // Location fetching routes for registration form
    Route::get('/b2b/locations/countries', [LocationController::class, 'getCountries']);
    Route::get('/b2b/locations/states', [LocationController::class, 'getStates']);
    Route::get('/b2b/locations/cities', [LocationController::class, 'getCities']);

    // Multi-language Translations (Advanced+)
    Route::get('/b2b/translations', [B2BTranslationController::class, 'index']);
    Route::post('/b2b/translations/upsert', [B2BTranslationController::class, 'upsert'])->middleware('check.b2b.subscription:translations');
    Route::delete('/b2b/translations/{locale}', [B2BTranslationController::class, 'deleteLocale'])->middleware('check.b2b.subscription:translations');

    // Quick Order Pad & CSV Bulk Order SKU lookup (Grow+)
    Route::match(['get', 'post'], '/b2b/ordering/lookup-skus', [B2BOrderingController::class, 'lookupSkus'])->middleware('check.b2b.subscription:ordering');

    // Reusable B2B Shopping Lists (Advanced+)
    Route::get('/b2b/shopping-lists', [B2BShoppingListController::class, 'index']);
    Route::post('/b2b/shopping-lists', [B2BShoppingListController::class, 'store'])->middleware('check.b2b.subscription:shopping_list');
    Route::post('/b2b/shopping-lists/{id}/status', [B2BShoppingListController::class, 'updateStatus'])->middleware('check.b2b.subscription:shopping_list');
    Route::delete('/b2b/shopping-lists/{id}', [B2BShoppingListController::class, 'destroy'])->middleware('check.b2b.subscription:shopping_list');

    // Users & Permissions / Company Team Members (Enterprise)
    Route::get('/b2b/team-members', [B2BCompanyMemberController::class, 'index']);
    Route::post('/b2b/team-members', [B2BCompanyMemberController::class, 'store'])->middleware('check.b2b.subscription:team_roles');
    Route::put('/b2b/team-members/{id}', [B2BCompanyMemberController::class, 'update'])->middleware('check.b2b.subscription:team_roles');
    Route::delete('/b2b/team-members/{id}', [B2BCompanyMemberController::class, 'destroy'])->middleware('check.b2b.subscription:team_roles');

    // Credit Limit & Finance Ledger (Enterprise)
    Route::get('/b2b/credit-accounts', [B2BCreditFinanceController::class, 'index']);
    Route::post('/b2b/credit-accounts', [B2BCreditFinanceController::class, 'upsertAccount'])->middleware('check.b2b.subscription:credit');
    Route::post('/b2b/credit-accounts/{id}/transactions', [B2BCreditFinanceController::class, 'recordTransaction'])->middleware('check.b2b.subscription:credit');
});
