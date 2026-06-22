<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\B2BRegistrationController;
use App\Http\Controllers\API\LocationController;
use App\Http\Controllers\API\QuoteSettingsController;
use App\Http\Controllers\API\B2BQuoteController;

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

// B2B registration endpoint with 6 requests per minute per IP rate limiting
Route::post('/b2b/register', [B2BRegistrationController::class, 'register'])
    ->middleware('throttle:6,1');

// B2B admin applications management routes
Route::get('/b2b/applications', [B2BRegistrationController::class, 'index']);
Route::get('/b2b/applications/{id}', [B2BRegistrationController::class, 'show']);
Route::post('/b2b/applications/{id}/approve', [B2BRegistrationController::class, 'approve']);
Route::post('/b2b/applications/{id}/reject', [B2BRegistrationController::class, 'reject']);

// B2B admin subscriptions pricing management routes
Route::get('/b2b/subscriptions', [B2BRegistrationController::class, 'getSubscriptions']);

// B2B quote settings routes
Route::get('/b2b/quote-settings', [QuoteSettingsController::class, 'getSettings']);
Route::post('/b2b/quote-settings/update', [QuoteSettingsController::class, 'updateSettings']);

// B2B notification settings routes
Route::get('/b2b/notification-settings', [B2BRegistrationController::class, 'getNotificationSettings']);
Route::post('/b2b/notification-settings/update', [B2BRegistrationController::class, 'updateNotificationSetting']);

// B2B registration form configuration routes
Route::get('/b2b/form-config', [B2BRegistrationController::class, 'getFormConfig']);
Route::post('/b2b/form-config/update', [B2BRegistrationController::class, 'updateFormConfig']);

// B2B quotes CRUD routes
Route::get('/b2b/quotes', [B2BQuoteController::class, 'index']);
Route::get('/b2b/quotes/{id}', [B2BQuoteController::class, 'show']);
Route::post('/b2b/quotes', [B2BQuoteController::class, 'store']);
Route::post('/b2b/quotes/{id}/update', [B2BQuoteController::class, 'update']);
Route::post('/b2b/quotes/{id}/send', [B2BQuoteController::class, 'send']);

// Location fetching routes for registration form
Route::get('/b2b/locations/countries', [LocationController::class, 'getCountries']);
Route::get('/b2b/locations/states', [LocationController::class, 'getStates']);
Route::get('/b2b/locations/cities', [LocationController::class, 'getCities']);
