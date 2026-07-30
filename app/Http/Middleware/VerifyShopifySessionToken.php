<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ShopifyShop;
use App\Traits\HasShopifyApi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class VerifyShopifySessionToken
{
    use HasShopifyApi;

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $authorization = $request->header('Authorization');

        if (!$authorization || !str_starts_with($authorization, 'Bearer ')) {
            // Check if this is a route that can be accessed publicly by storefront
            if ($this->isPublicRoute($request)) {
                $shopDomain = $this->resolveShopDomainFromRequest($request);
                if ($shopDomain) {
                    $request->headers->set('X-Shop-Domain', $shopDomain);
                    $request->query->set('shop', $shopDomain);
                    $request->merge(['shop' => $shopDomain]);
                }
                return $next($request);
            }

            Log::warning('[VerifyShopifySessionToken] Authorization header missing or malformed for admin route.');
            return response()->json([
                'error' => 'MISSING_SESSION_TOKEN',
                'message' => 'Shopify Session Token is required.'
            ], 401);
        }

        $sessionToken = substr($authorization, 7);
        $apiSecret = config('shopify.api_secret');
        $apiKey = config('shopify.api_key');

        if (!$apiSecret || !$apiKey) {
            Log::error('[VerifyShopifySessionToken] Shopify API credentials not configured in backend.');
            return response()->json([
                'error' => 'SERVER_CONFIGURATION_ERROR',
                'message' => 'Shopify API credentials are not configured.'
            ], 500);
        }

        // 1. Decode and verify JWT session token
        $payload = $this->decodeSessionToken($sessionToken, $apiSecret);

        if (!$payload) {
            Log::warning('[VerifyShopifySessionToken] Failed to decode/verify session token.');
            return response()->json([
                'error' => 'INVALID_SESSION_TOKEN',
                'message' => 'Shopify Session Token is invalid or expired.'
            ], 401);
        }

        // 2. Validate standard audience claim (client_id / api_key)
        $aud = $payload['aud'] ?? null;
        if ($aud !== $apiKey) {
            Log::warning("[VerifyShopifySessionToken] Audience mismatch. Received: {$aud}, Expected: {$apiKey}");
            return response()->json([
                'error' => 'INVALID_SESSION_TOKEN',
                'message' => 'Audience mismatch.'
            ], 401);
        }

        // 3. Extract destination shop domain
        $dest = $payload['dest'] ?? null;
        if (!$dest) {
            Log::warning('[VerifyShopifySessionToken] Session token destination domain missing.');
            return response()->json([
                'error' => 'INVALID_SESSION_TOKEN',
                'message' => 'Destination claim missing from token.'
            ], 401);
        }

        $shopDomain = preg_replace('/^https?:\/\//i', '', $dest);
        $shopDomain = explode('/', $shopDomain)[0];

        // 4. Resolve Shop record and check for token availability/expiration
        $shopRecord = ShopifyShop::where('shop_domain', $shopDomain)->first();

        // 5. If shop is not in database, or has no access token, execute Token Exchange flow
        if (!$shopRecord || !$shopRecord->access_token) {
            Log::info("[VerifyShopifySessionToken] Initiating Token Exchange flow for: {$shopDomain}");

            $exchangeData = $this->exchangeSessionTokenForAccessToken($shopDomain, $sessionToken);

            if (!$exchangeData || !isset($exchangeData['access_token'])) {
                Log::error("[VerifyShopifySessionToken] Token exchange failed for shop: {$shopDomain}");
                return response()->json([
                    'error' => 'TOKEN_EXCHANGE_FAILED',
                    'message' => 'Could not complete token exchange authentication.'
                ], 401);
            }

            $accessToken = $exchangeData['access_token'];
            $refreshToken = $exchangeData['refresh_token'] ?? null;
            $expiresIn = $exchangeData['expires_in'] ?? null;
            $expiresAt = $expiresIn ? now()->addSeconds($expiresIn - 60) : null;

            $shopRecord = ShopifyShop::updateOrCreate(
                ['shop_domain' => $shopDomain],
                [
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken,
                    'expires_at' => $expiresAt
                ]
            );

            Log::info("[VerifyShopifySessionToken] Completed Token Exchange. Access Token saved for {$shopDomain}");

            // Register uninstall webhook dynamically
            $this->registerUninstallWebhook($shopDomain, $accessToken);
        }

        // 6. If shop access token is expired, refresh it using refresh_token
        if ($shopRecord->refresh_token && $shopRecord->expires_at && $shopRecord->expires_at->isPast()) {
            Log::info("[VerifyShopifySessionToken] Shopify access token expired for {$shopDomain}, attempting refresh.");
            $this->refreshShopifyAccessToken($shopRecord);
        }

        // 7. Inject verified shop domain into request headers & query so controllers can consume it directly
        $request->headers->set('X-Shop-Domain', $shopDomain);
        $request->query->set('shop', $shopDomain);
        $request->merge(['shop' => $shopDomain]);

        return $next($request);
    }

    /**
     * Decode and verify standard HS256 JWT Shopify session token.
     */
    private function decodeSessionToken(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($headerB64, $payloadB64, $signatureB64) = $parts;

        // Verify signature using HMAC SHA256
        $calculatedSignature = hash_hmac(
            'sha256',
            "$headerB64.$payloadB64",
            $secret,
            true
        );

        // URL-safe base64 decode for signature
        $sigDecoded = base64_decode(strtr($signatureB64, '-_', '+/'));

        if (!hash_equals($calculatedSignature, $sigDecoded)) {
            return null;
        }

        $payload = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);
        if (!$payload) {
            return null;
        }

        $now = time();

        // Validate expiration time
        if (isset($payload['exp']) && $payload['exp'] < $now) {
            Log::warning("[VerifyShopifySessionToken] Token expired. Exp: {$payload['exp']}, Now: {$now}");
            return null;
        }

        // Validate not before (with 10-second skew tolerance)
        if (isset($payload['nbf']) && $payload['nbf'] > ($now + 10)) {
            Log::warning("[VerifyShopifySessionToken] Token not active yet. Nbf: {$payload['nbf']}, Now: {$now}");
            return null;
        }

        return $payload;
    }

    /**
     * Check if the request is for a route that is publicly accessible by the storefront.
     */
    private function isPublicRoute(Request $request): bool
    {
        $path = $request->path();
        $method = $request->method();

        // Standard public endpoints
        $publicRoutes = [
            'api/b2b/register' => ['POST'],
            'api/b2b/quote-settings' => ['GET'],
            'api/b2b/form-config' => ['GET'],
            'api/b2b/locations/countries' => ['GET'],
            'api/b2b/locations/states' => ['GET'],
            'api/b2b/locations/cities' => ['GET'],
            'api/b2b/quotes' => ['POST', 'GET'], 
        ];

        foreach ($publicRoutes as $routePath => $methods) {
            if ($path === $routePath && in_array($method, $methods)) {
                if ($routePath === 'api/b2b/quotes' && $method === 'GET') {
                    // Only public if email is provided (storefront quotes tab query)
                    return $request->has('email');
                }
                return true;
            }
        }

        // Allow updates of quotes from storefront (e.g. api/b2b/quotes/{id}/update)
        if ($method === 'POST' && preg_match('/^api\/b2b\/quotes\/[^\/]+\/update$/i', $path)) {
            return true;
        }

        return false;
    }

    /**
     * Resolve the shop domain from query parameters, headers, or referrer for public requests.
     */
    private function resolveShopDomainFromRequest(Request $request): ?string
    {
        $shop = $request->query('shop') ?? $request->header('X-Shop-Domain');
        if (!$shop) {
            $referrer = $request->header('referer');
            if ($referrer) {
                $parts = parse_url($referrer);
                if (isset($parts['query'])) {
                    parse_str($parts['query'], $query);
                    if (isset($query['shop'])) {
                        $shop = $query['shop'];
                    }
                }
            }
        }

        if ($shop) {
            $shop = preg_replace('/^https?:\/\//i', '', $shop);
            $shop = explode('/', $shop)[0];
        }

        return $shop;
    }
}
