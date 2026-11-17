<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
                \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BApplication::where('shop_domain', $shopDomain)->delete();
                \App\Models\B2BQuote::where('shop_domain', $shopDomain)->delete();
                Log::info("Successfully purged all shop data for {$shopDomain} following shop/redact request.");
            }
        } catch (\Exception $e) {
            Log::error("Error processing shop redact for {$shopDomain}: " . $e->getMessage());
        }

        return response()->json(['message' => 'Shop redact processed successfully'], 200);
    }
}
