<?php

namespace App\Http\Controllers;

use App\Models\ShopifyShop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ShopifyAuthController extends Controller
{
    /**
     * Start the Shopify OAuth Installation flow.
     */
    public function install(Request $request)
    {
        $shop = $request->query('shop');

        if (!$shop || !preg_match('/^[a-zA-Z0-9.-]+\.myshopify\.com$/', $shop)) {
            return response()->json(['error' => 'Invalid shop domain.'], 400);
        }

        $apiKey = config('shopify.api_key');
        $scopes = 'read_customers,write_customers,read_companies,write_companies';
        $redirectUri = route('shopify.auth.callback');
        
        // Generate random state/nonce and save to session
        $state = Str::random(24);
        session(['shopify_oauth_state' => $state]);

        $authUrl = "https://{$shop}/admin/oauth/authorize?client_id={$apiKey}&scope={$scopes}&redirect_uri=" . urlencode($redirectUri) . "&state={$state}";

        return view('iframe_redirect', ['redirectUrl' => $authUrl]);
    }

    /**
     * Handle Shopify OAuth callback.
     */
    public function callback(Request $request)
    {
        $params = $request->all();
        $shop = $request->query('shop');
        $code = $request->query('code');
        $state = $request->query('state');

        // 1. Verify HMAC
        $apiSecret = config('shopify.api_secret');
        if (!$this->verifyHmac($params, $apiSecret)) {
            Log::error('Shopify OAuth HMAC verification failed.', ['params' => $params]);
            return response()->json(['error' => 'HMAC verification failed.'], 400);
        }

        // 2. Verify State/Nonce (skip in local environment to prevent session loss from iframe cookie block)
        $savedState = session('shopify_oauth_state');
        if (config('app.env') !== 'local') {
            if (!$state || $state !== $savedState) {
                Log::error('Shopify OAuth state mismatch.', ['received' => $state, 'saved' => $savedState]);
                return response()->json(['error' => 'State parameter mismatch.'], 400);
            }
        }
        
        // Clear state from session
        session()->forget('shopify_oauth_state');

        // 3. Exchange temporary code for access token
        $tokenUrl = "https://{$shop}/admin/oauth/access_token";
        
        try {
            $response = Http::post($tokenUrl, [
                'client_id' => config('shopify.api_key'),
                'client_secret' => $apiSecret,
                'code' => $code,
                'expiring' => 1, // Start requesting expiring offline tokens (using integer 1 as per Shopify spec)
            ]);

            if ($response->failed()) {
                Log::error('Shopify access token exchange failed.', ['response' => $response->body()]);
                return response()->json(['error' => 'Access token exchange failed.'], 400);
            }

            $data = $response->json();
            $accessToken = $data['access_token'];
            $refreshToken = $data['refresh_token'] ?? null;
            $expiresIn = $data['expires_in'] ?? null;
            $expiresAt = $expiresIn ? now()->addSeconds($expiresIn - 60) : null; // 60-second safety buffer

            // 4. Save/Update Shop in Database
            $shopifyShop = ShopifyShop::updateOrCreate(
                ['shop_domain' => $shop],
                [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'expires_at' => $expiresAt
                ]
            );

            Log::info("Shopify App successfully installed / updated for: {$shop} (Expiring Token Enabled)");

            // 5. Register uninstalled webhook automatically
            $this->registerUninstallWebhook($shop, $accessToken);

            // 6. Redirect back to Shopify Admin app dashboard
            $apiKey = config('shopify.api_key');
            return redirect("https://{$shop}/admin/apps/{$apiKey}");

        } catch (\Exception $e) {
            Log::error('Shopify OAuth callback exception: ' . $e->getMessage());
            return response()->json(['error' => 'An unexpected error occurred during installation.'], 500);
        }
    }

    /**
     * Handle Shopify uninstallation webhook.
     */
    public function webhookUninstalled(Request $request)
    {
        $hmac = $request->header('x-shopify-hmac-sha256');
        $data = $request->getContent();
        $apiSecret = config('shopify.api_secret');

        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $apiSecret, true));
        if (!hash_equals($calculatedHmac, $hmac)) {
            Log::warning('Shopify uninstalled webhook HMAC verification failed.');
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $shopDomain = $request->header('x-shopify-shop-domain');
        if ($shopDomain) {
            ShopifyShop::where('shop_domain', $shopDomain)->delete();
            Log::info("Deleted token and shop records for uninstalled shop: {$shopDomain}");
        }

        return response()->json(['message' => 'Webhook received successfully'], 200);
    }

    /**
     * Verify Shopify HMAC signature.
     */
    private function verifyHmac(array $params, string $secret): bool
    {
        if (!isset($params['hmac'])) {
            return false;
        }
        $hmac = $params['hmac'];
        unset($params['hmac']);

        ksort($params);

        $parts = [];
        foreach ($params as $key => $value) {
            // Arrays are skipped in string generation
            if (is_array($value)) {
                continue;
            }
            $parts[] = "$key=$value";
        }
        $queryString = implode('&', $parts);

        $calculatedHmac = hash_hmac('sha256', $queryString, $secret);

        return hash_equals($calculatedHmac, $hmac);
    }

    /**
     * Register app/uninstalled webhook dynamically for the shop.
     */
    private function registerUninstallWebhook(string $shop, string $accessToken): void
    {
        $apiVersion = config('shopify.api_version', '2026-04');
        $webhookUrl = "https://{$shop}/admin/api/{$apiVersion}/webhooks.json";
        $callbackUrl = route('shopify.webhook.uninstalled');

        try {
            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])->post($webhookUrl, [
                'webhook' => [
                    'topic' => 'app/uninstalled',
                    'address' => $callbackUrl,
                    'format' => 'json'
                ]
            ]);

            if ($response->failed()) {
                Log::warning("Failed to register uninstall webhook for {$shop}: " . $response->body());
            } else {
                Log::info("Successfully registered uninstall webhook for {$shop}");
            }
        } catch (\Exception $e) {
            Log::error("Webhook registration exception for {$shop}: " . $e->getMessage());
        }
    }
}
