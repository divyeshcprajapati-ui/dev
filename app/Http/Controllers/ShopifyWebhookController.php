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
}
