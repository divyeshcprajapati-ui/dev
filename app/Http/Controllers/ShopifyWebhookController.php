<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Jobs\ProcessShopifyWebhookJob;

class ShopifyWebhookController extends Controller
{
    /**
     * Verify the Shopify webhook signature (HMAC).
     */
    private function verifyHmac(Request $request): bool
    {
        $hmac = $request->header('x-shopify-hmac-sha256');
        $data = $request->getContent();
        $apiSecret = config('shopify.api_secret');

        if (!$hmac || !$apiSecret) {
            return false;
        }

        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $apiSecret, true));
        return hash_equals($calculatedHmac, $hmac);
    }

    /**
     * Handle company creation webhook.
     */
    public function handleCompanyCreated(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify company/create webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $topic = $request->header('x-shopify-topic', 'companies/create');
        $shopDomain = $request->header('x-shopify-shop-domain');
        $webhookId = $request->header('x-shopify-webhook-id');
        $payload = $request->json()->all();

        // Dispatch to Queue immediately to respond within 5s
        ProcessShopifyWebhookJob::dispatch($topic, $shopDomain, $webhookId, $payload);

        return response()->json(['message' => 'Webhook received successfully'], 200);
    }

    /**
     * Handle quote creation and updates.
     */
    public function handleQuoteUpdated(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify quote webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $topic = $request->header('x-shopify-topic', 'quotes/update');
        $shopDomain = $request->header('x-shopify-shop-domain');
        $webhookId = $request->header('x-shopify-webhook-id');
        $payload = $request->json()->all();

        ProcessShopifyWebhookJob::dispatch($topic, $shopDomain, $webhookId, $payload);

        return response()->json(['message' => 'Webhook received successfully'], 200);
    }

    /**
     * Handle customer data request (Mandatory Shopify GDPR compliance).
     */
    public function handleCustomerDataRequest(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify customers/data_request webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? $request->header('x-shopify-shop-domain');
        $customerEmail = $payload['customer']['email'] ?? null;
        $customerId = $payload['customer']['id'] ?? null;

        Log::info("Shopify customer data request received for customer: {$customerEmail} on shop: {$shopDomain}", [
            'customer_id' => $customerId,
            'orders_requested' => $payload['orders_requested'] ?? [],
        ]);

        return response()->json(['message' => 'Customer data request logged successfully'], 200);
    }

    /**
     * Handle customer redact request (Mandatory Shopify GDPR compliance).
     * Shopify requires processing within 5 days.
     */
    public function handleCustomerRedact(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify customers/redact webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? $request->header('x-shopify-shop-domain');
        $customerEmail = $payload['customer']['email'] ?? null;
        $customerId = $payload['customer']['id'] ?? null;

        Log::info("Shopify customer redact requested for customer: {$customerEmail} on shop: {$shopDomain}");

        try {
            // Anonymize or redact customer records in b2b_applications
            if ($customerEmail || $customerId) {
                $query = \App\Models\B2BApplication::query();
                if ($shopDomain) {
                    $query->where('shop_domain', $shopDomain);
                }
                $query->where(function ($q) use ($customerEmail, $customerId) {
                    if ($customerEmail) {
                        $q->where('email', $customerEmail);
                    }
                    if ($customerId) {
                        $q->orWhere('shopify_customer_id', $customerId)
                          ->orWhere('shopify_customer_id', "gid://shopify/Customer/{$customerId}");
                    }
                });

                // Delete any uploaded private business documents before clearing paths
                $docPaths = (clone $query)
                    ->whereNotNull('business_document_path')
                    ->pluck('business_document_path');
                foreach ($docPaths as $docPath) {
                    if ($docPath && Storage::disk('local')->exists($docPath)) {
                        Storage::disk('local')->delete($docPath);
                    }
                }

                $query->update([
                    'first_name' => 'Redacted',
                    'last_name' => 'Redacted',
                    'email' => 'redacted@privacy.local',
                    'phone' => null,
                    'address' => 'Redacted',
                    'business_document_path' => null,
                    'notes' => 'Redacted per Shopify GDPR customer/redact request',
                ]);
            }

            // Anonymize customer data in b2b_quotes
            if ($customerEmail) {
                $quoteQuery = \App\Models\B2BQuote::query();
                if ($shopDomain) {
                    $quoteQuery->where('shop_domain', $shopDomain);
                }
                $quoteQuery->where('customer_email', $customerEmail)
                    ->update([
                        'customer_name' => 'Redacted Customer',
                        'customer_email' => 'redacted@privacy.local',
                        'shipping_address' => 'Redacted',
                        'billing_address' => null,
                    ]);

                // Redact customer PII in shopping lists, team members, and credit accounts
                \App\Models\B2BShoppingList::when($shopDomain, fn($q) => $q->where('shop_domain', $shopDomain))
                    ->where('customer_email', $customerEmail)
                    ->update(['customer_name' => 'Redacted', 'customer_email' => 'redacted@privacy.local']);

                \App\Models\B2BCompanyMember::when($shopDomain, fn($q) => $q->where('shop_domain', $shopDomain))
                    ->where('email', $customerEmail)
                    ->delete();

                \App\Models\B2BCreditAccount::when($shopDomain, fn($q) => $q->where('shop_domain', $shopDomain))
                    ->where('customer_email', $customerEmail)
                    ->update(['customer_email' => 'redacted@privacy.local']);
            }

            Log::info("Successfully redacted customer PII for {$customerEmail} on shop {$shopDomain}");
        } catch (\Exception $e) {
            Log::error("Error redacting customer data: " . $e->getMessage());
        }

        return response()->json(['message' => 'Customer redact processed successfully'], 200);
    }

    /**
     * Handle shop redact request (Mandatory Shopify GDPR compliance).
     * Triggered 48 hours after an app uninstalls from a store.
     */
    public function handleShopRedact(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify shop/redact webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payload = $request->json()->all();
        $shopDomain = $payload['shop_domain'] ?? $request->header('x-shopify-shop-domain');

        Log::info("Shopify shop/redact requested for shop: {$shopDomain}");

        try {
            if ($shopDomain) {
                // Delete uploaded business documents belonging to this shop
                $docPaths = \App\Models\B2BApplication::where('shop_domain', $shopDomain)
                    ->whereNotNull('business_document_path')
                    ->pluck('business_document_path');
                foreach ($docPaths as $docPath) {
                    if ($docPath && Storage::disk('local')->exists($docPath)) {
                        Storage::disk('local')->delete($docPath);
                    }
                }

                // Delete quote items before deleting quotes
                $quoteIds = \App\Models\B2BQuote::where('shop_domain', $shopDomain)->pluck('id');
                if ($quoteIds->isNotEmpty()) {
                    \App\Models\B2BQuoteItem::whereIn('b2b_quote_id', $quoteIds)->delete();
                }

                \App\Models\B2BQuote::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BApplication::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BQuoteSetting::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BNotificationSetting::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BTranslation::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BShoppingList::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BCompanyMember::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BLedgerEntry::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BCreditAccount::where('shop_domain', $shopDomain)->delete();
                \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->delete();

                Log::info("Successfully purged all shop data and files for {$shopDomain} following shop/redact request.");
            }
        } catch (\Exception $e) {
            Log::error("Error processing shop redact for {$shopDomain}: " . $e->getMessage());
        }

        return response()->json(['message' => 'Shop redact processed successfully'], 200);
    }

    /**
     * Handle Shopify APP_SUBSCRIPTIONS_UPDATE webhook.
     * Keeps local subscription access synchronized when Shopify activates, freezes,
     * cancels, declines, or expires a merchant's recurring subscription.
     */
    public function handleAppSubscriptionUpdate(Request $request)
    {
        if (!$this->verifyHmac($request)) {
            Log::warning('Shopify app_subscriptions/update webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $shopDomain = $request->header('x-shopify-shop-domain');
        $payload = $request->json()->all();
        $appSubscription = $payload['app_subscription'] ?? $payload;

        $subscriptionGid = $appSubscription['admin_graphql_api_id'] ?? null;
        $status = strtoupper((string) ($appSubscription['status'] ?? ''));
        $name = (string) ($appSubscription['name'] ?? '');

        Log::info("Shopify app_subscriptions/update received for {$shopDomain}", [
            'subscription_id' => $subscriptionGid,
            'status' => $status,
            'name' => $name,
        ]);

        if (!$shopDomain) {
            return response()->json(['message' => 'Missing shop domain'], 200);
        }

        try {
            $shop = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
            if (!$shop) {
                Log::warning("Shop not found for app_subscriptions/update: {$shopDomain}");
                return response()->json(['message' => 'Shop not found'], 200);
            }

            if ($status === 'ACTIVE') {
                // Record the active subscription ID; infer plan from name if webhook arrived before billingCallback
                if ($subscriptionGid) {
                    $shop->shopify_subscription_id = $subscriptionGid;
                }

                if (($shop->active_plan ?? 'free') === 'free' && $name) {
                    $lowerName = strtolower($name);
                    if (str_contains($lowerName, 'enterprise') || str_contains($lowerName, 'plus')) {
                        $shop->active_plan = 'plus';
                        $shop->selected_modules = ['quotePlus'];
                    } elseif (str_contains($lowerName, 'advanced')) {
                        $shop->active_plan = 'advanced';
                        $shop->selected_modules = ['quoteAdv'];
                    } elseif (str_contains($lowerName, 'grow')) {
                        $shop->active_plan = 'grow';
                        $shop->selected_modules = ['quoteGrow'];
                    }
                    if (str_contains($lowerName, 'annual')) {
                        $shop->billing_cycle = 'annually';
                    }
                }

                $shop->save();
                Log::info("Synchronized ACTIVE subscription for {$shopDomain} (Plan: {$shop->active_plan}, ID: {$shop->shopify_subscription_id})");
            } elseif (in_array($status, ['CANCELLED', 'FROZEN', 'EXPIRED', 'DECLINED'], true)) {
                // Guard against upgrade/downgrade race condition:
                // When a merchant switches plans, Shopify cancels the OLD subscription ID after activating the NEW one.
                if (
                    !empty($shop->shopify_subscription_id)
                    && !empty($subscriptionGid)
                    && $shop->shopify_subscription_id !== $subscriptionGid
                ) {
                    Log::info("Ignoring {$status} webhook for superseded subscription {$subscriptionGid} on {$shopDomain} (current active ID: {$shop->shopify_subscription_id}).");
                    return response()->json(['message' => 'Superseded subscription ignored'], 200);
                }

                $freeModules = \App\Models\B2BSubscription::where('plan_type', 'free')
                    ->pluck('subscription_key')
                    ->toArray();

                $shop->active_plan = 'free';
                $shop->selected_modules = $freeModules;
                $shop->shopify_subscription_id = null;
                $shop->billing_cycle = 'monthly';
                $shop->save();

                Log::info("Revoked paid plan access for {$shopDomain} due to subscription status: {$status}");
            }
        } catch (\Exception $e) {
            Log::error("Error processing app_subscriptions/update for {$shopDomain}: " . $e->getMessage());
        }

        return response()->json(['message' => 'App subscription update processed successfully'], 200);
    }
}
