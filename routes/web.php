<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ShopifyAuthController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

use App\Models\ShopifyShop;
use Illuminate\Http\Request;

// Shopify OAuth installation routes
Route::get('/auth/shopify', [ShopifyAuthController::class, 'install'])->name('shopify.auth.install');
Route::get('/auth/shopify/callback', [ShopifyAuthController::class, 'callback'])->name('shopify.auth.callback');

use App\Http\Controllers\ShopifyWebhookController;
use App\Http\Controllers\ShopifyBillingController;

// Shopify Billing Redirect
Route::get('/billing/shopify/callback', [ShopifyBillingController::class, 'billingCallback'])->name('shopify.billing.callback');

// Shopify Webhooks
Route::post('/webhooks/shopify/app-uninstalled', [ShopifyAuthController::class, 'webhookUninstalled'])->name('shopify.webhook.uninstalled');
Route::post('/webhooks/shopify/company-created', [ShopifyWebhookController::class, 'handleCompanyCreated'])->name('shopify.webhook.company_created');
Route::post('/webhooks/shopify/quote-updated', [ShopifyWebhookController::class, 'handleQuoteUpdated'])->name('shopify.webhook.quote_updated');

// Shopify Mandatory GDPR / Privacy Compliance Webhooks
Route::post('/webhooks/shopify/customers-data-request', [ShopifyWebhookController::class, 'handleCustomerDataRequest'])->name('shopify.webhook.customers_data_request');
Route::post('/webhooks/shopify/customers-redact', [ShopifyWebhookController::class, 'handleCustomerRedact'])->name('shopify.webhook.customers_redact');
Route::post('/webhooks/shopify/shop-redact', [ShopifyWebhookController::class, 'handleShopRedact'])->name('shopify.webhook.shop_redact');

// Marketing Website, Privacy Policy & Terms of Service for Shopify App Store
Route::get('/website', function () {
    return view('landing');
})->name('website');

Route::get('/privacy-policy', function () {
    return view('privacy');
})->name('privacy');

Route::get('/terms', function () {
    return view('terms');
})->name('terms');

// Intercept root page load: if embedded inside Shopify Admin (has shop/host/embedded), load React App; otherwise load Marketing Website
Route::middleware('shopify.csp')->group(function () {
    Route::get('/', function (Request $request) {
        if ($request->has('shop') || $request->has('host') || $request->has('embedded')) {
            return view('app');
        }
        return view('landing');
    });

    Route::get('/{any}', function () {
        return view('app');
    })->where('any', '^(?!log-viewer|api|webhooks|website|privacy-policy|terms).*$');
});

