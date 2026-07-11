<?php

namespace App\Traits;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

trait HasShopifyApi
{
    /**
     * Helper to make GraphQL requests to Shopify Admin API.
     */
    protected function queryShopifyGraphQL(string $query, array $variables = [], ?string $shopDomain = null): array
    {
        $accessToken = $this->getAccessToken($shopDomain);
        $apiVersion = config('shopify.api_version', '2026-04');

        if (!$shopDomain || !$accessToken) {
            Log::warning('Shopify shop domain or access token not configured. Skipping live API call.', [
                'shopDomain' => $shopDomain,
                'hasToken' => !empty($accessToken)
            ]);
            return ['success' => false, 'error' => 'Shopify API credentials not configured.'];
        }

        $url = "https://{$shopDomain}/admin/api/{$apiVersion}/graphql.json";

        try {
            $postData = [
                'query' => $query,
            ];
            if (!empty($variables)) {
                $postData['variables'] = $variables;
            }

            $response = Http::withHeaders([
                'X-Shopify-Access-Token' => $accessToken,
                'Content-Type' => 'application/json',
            ])->post($url, $postData);

            if ($response->failed()) {
                Log::error('Shopify GraphQL API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return ['success' => false, 'error' => 'API Request Failed: ' . $response->body()];
            }

            $data = $response->json();
            if (isset($data['errors'])) {
                $hasAccessDenied = collect($data['errors'])->contains(fn($err) => str_contains($err['message'] ?? '', 'not approved to access the Customer object') || ($err['extensions']['code'] ?? '') === 'ACCESS_DENIED');
                if ($hasAccessDenied) {
                    Log::warning('Shopify GraphQL API returned ACCESS_DENIED (Protected Customer Data approval may be missing).', ['errors' => $data['errors']]);
                } else {
                    Log::error('Shopify GraphQL API returned errors', ['errors' => $data['errors']]);
                }
                return ['success' => false, 'errors' => $data['errors']];
            }

            return ['success' => true, 'data' => $data['data']];
        } catch (Exception $e) {
            Log::error('Shopify GraphQL API communication error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Retrieve the active access token for the shop, refreshing it if expired.
     */
    protected function getAccessToken(?string $shopDomain): string
    {
        if (!$shopDomain) {
            return config('shopify.access_token');
        }

        $shop = \App\Models\ShopifyShop::where('shop_domain', $shopDomain)->first();
        if (!$shop) {
            return config('shopify.access_token');
        }

        // Check if token has expired or is about to expire (within 5 minutes)
        if ($shop->refresh_token && $shop->expires_at && $shop->expires_at->isPast()) {
            Log::info("Shopify access token expired for {$shopDomain}, attempting refresh.");
            $this->refreshShopifyAccessToken($shop);
        }

        return $shop->access_token;
    }

    /**
     * Refresh the Shopify access token using the refresh token.
     */
    protected function refreshShopifyAccessToken(\App\Models\ShopifyShop $shop): void
    {
        $tokenUrl = "https://{$shop->shop_domain}/admin/oauth/access_token";

        try {
            $response = Http::post($tokenUrl, [
                'client_id' => config('shopify.api_key'),
                'client_secret' => config('shopify.api_secret'),
                'grant_type' => 'refresh_token',
                'refresh_token' => $shop->refresh_token,
            ]);

            if ($response->failed()) {
                Log::error("Failed to refresh Shopify access token for {$shop->shop_domain}: " . $response->body());
                return;
            }

            $data = $response->json();
            $accessToken = $data['access_token'];
            $refreshToken = $data['refresh_token'] ?? $shop->refresh_token;
            $expiresIn = $data['expires_in'] ?? null;
            $expiresAt = $expiresIn ? now()->addSeconds($expiresIn - 60) : null;

            $shop->update([
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken,
                'expires_at' => $expiresAt
            ]);

            Log::info("Successfully refreshed Shopify access token for {$shop->shop_domain}");
        } catch (Exception $e) {
            Log::error("Exception refreshing Shopify access token for {$shop->shop_domain}: " . $e->getMessage());
        }
    }

    /**
     * Search for customer GID by email.
     */
    protected function getShopifyCustomerIdByEmail(string $email, string $shopDomain): ?string
    {
        $query = '
        query getCustomerByEmail($query: String!) {
          customers(first: 1, query: $query) {
            edges {
              node {
                id
              }
            }
          }
        }';

        $res = $this->queryShopifyGraphQL($query, ['query' => "email:{$email}"], $shopDomain);
        if ($res['success']) {
            return $res['data']['customers']['edges'][0]['node']['id'] ?? null;
        }
        return null;
    }

    /**
     * Get the first customer GID on the store (for fallback).
     */
    protected function getFirstShopifyCustomerId(string $shopDomain): ?string
    {
        $query = '
        query {
          customers(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }';

        $res = $this->queryShopifyGraphQL($query, [], $shopDomain);
        if ($res['success']) {
            return $res['data']['customers']['edges'][0]['node']['id'] ?? null;
        }
        return null;
    }
}
