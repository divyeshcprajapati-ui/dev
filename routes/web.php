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

// Intercept root page load to verify shop installation
Route::get('/', function (Request $request) {
    return view('app');
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!log-viewer|api|webhooks).*$');

