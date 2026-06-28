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

// Shopify Webhooks
Route::post('/webhooks/shopify/app-uninstalled', [ShopifyAuthController::class, 'webhookUninstalled'])->name('shopify.webhook.uninstalled');

// Intercept root page load to verify shop installation
Route::get('/', function (Request $request) {
    $shop = $request->query('shop');
    if ($shop) {
        $shopRecord = ShopifyShop::where('shop_domain', $shop)->first();
        if (!$shopRecord) {
            return redirect()->route('shopify.auth.install', ['shop' => $shop]);
        }
    }
    return view('app');
});

Route::get('/{any}', function () {
    return view('app');
})->where('any', '^(?!log-viewer|api|webhooks).*$');

