<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\ShopifyShop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CheckB2BSubscription
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $feature)
    {
        $shopDomain = $this->resolveShopDomain($request);

        if (!$shopDomain) {
            return response()->json([
                'success' => false,
                'message' => 'Shop domain could not be resolved.'
            ], 400);
        }

        $shop = ShopifyShop::where('shop_domain', $shopDomain)->first();
        if (!$shop) {
            return response()->json([
                'success' => false,
                'message' => 'Shop not found.'
            ], 404);
        }

        $activePlan = $shop->active_plan ?? 'free';
        $selectedModules = $shop->selected_modules ?? [];

        // Free plan includes manageAccounts, teamRoles, signupForm, reviewApps
        // Paid features require selecting the corresponding module or plan
        $hasAccess = false;

        if ($activePlan === 'plus') {
            // Shopify Plus / Enterprise tier has full access to all features
            $hasAccess = true;
        } else {
            if ($feature === 'quote') {
                // Quotes are enabled if they subscribe to quoteGrow, quoteAdv, or quotePlus
                $hasAccess = collect($selectedModules)->contains(fn($module) => str_contains($module, 'quote'));
            } else if ($feature === 'role') {
                // Team roles are part of the free module
                $hasAccess = true; 
            } else if ($feature === 'registration') {
                // Registration form is free
                $hasAccess = true;
            }
        }

        if (!$hasAccess) {
            Log::warning("Access denied to feature '{$feature}' for shop {$shopDomain} (Active Plan: {$activePlan})");
            return response()->json([
                'success' => false,
                'error' => 'UPGRADE_REQUIRED',
                'message' => "The '{$feature}' feature is not included in your active plan. Please upgrade your subscription."
            ], 403);
        }

        return $next($request);
    }

    /**
     * Resolve shop domain dynamically from request queries, headers, or referrer.
     */
    private function resolveShopDomain(Request $request): ?string
    {
        $shop = $request->query('shop') ?? $request->header('X-Shop-Domain');
        if (!$shop && $request->has('shopDomain')) {
            $shop = $request->input('shopDomain');
        }
        
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
            $shop = str_replace(['https://', 'http://'], '', $shop);
            $shop = explode('/', $shop)[0];
        }

        return $shop;
    }
}
