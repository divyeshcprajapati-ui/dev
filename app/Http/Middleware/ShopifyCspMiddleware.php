<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ShopifyCspMiddleware
{
    /**
     * Handle an incoming request and attach required Content-Security-Policy frame-ancestors headers
     * for Shopify Admin embedded iframe loading.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        /** @var \Illuminate\Http\Response|\Symfony\Component\HttpFoundation\Response $response */
        $response = $next($request);

        // Determine shop domain from query, session, or default to all myshopify domains
        $shop = $request->query('shop') ?? session('shopify_shop');
        if ($shop && !preg_match('/^[a-zA-Z0-9.-]+\.myshopify\.com$/', $shop)) {
            $shop = null;
        }

        $shopAncestor = $shop ? "https://{$shop}" : "https://*.myshopify.com";
        $frameAncestors = "frame-ancestors 'self' {$shopAncestor} https://admin.shopify.com;";

        // Append or set Content-Security-Policy frame-ancestors
        $existingCsp = $response->headers->get('Content-Security-Policy');
        if ($existingCsp) {
            if (!str_contains($existingCsp, 'frame-ancestors')) {
                $response->headers->set('Content-Security-Policy', rtrim($existingCsp, '; ') . '; ' . $frameAncestors);
            }
        } else {
            $response->headers->set('Content-Security-Policy', $frameAncestors);
        }

        // Remove conflicting X-Frame-Options headers that prevent iframe embedding
        $response->headers->remove('X-Frame-Options');

        return $response;
    }
}

