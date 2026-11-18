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

        $activePlan = strtolower($shop->active_plan ?? 'free');
        $selectedModules = is_array($shop->selected_modules) ? $shop->selected_modules : [];

        // 4-tier feature hierarchy: free < grow < advanced < plus (Enterprise)
        $planRank = match ($activePlan) {
            'plus', 'enterprise' => 3,
            'advanced' => 2,
            'grow' => 1,
            default => 0,
        };

        $hasAccess = match ($feature) {
            // Free tier features
            'registration' => true,

            // Grow+ tier features ($29/mo+)
            'quote' => $planRank >= 1 || collect($selectedModules)->contains(fn($m) => str_contains((string) $m, 'quote')),
            'ordering' => $planRank >= 1 || collect($selectedModules)->contains(fn($m) => str_contains((string) $m, 'order')),

            // Advanced+ tier features ($79/mo+)
            'multi_quote' => $planRank >= 2,
            'shopping_list' => $planRank >= 2 || collect($selectedModules)->contains(fn($m) => str_contains((string) $m, 'list')),
            'translations' => $planRank >= 2,

            // Enterprise (plus) tier features ($149/mo)
            'role', 'team_roles' => $planRank >= 3,
            'credit', 'finance' => $planRank >= 3 || collect($selectedModules)->contains(fn($m) => str_contains((string) $m, 'finance')),
            'flow' => $planRank >= 3,

            default => $planRank >= 3,
        };

        if (!$hasAccess) {
            $requiredPlan = match ($feature) {
                'quote', 'ordering' => 'Grow',
                'multi_quote', 'shopping_list', 'translations' => 'Advanced',
                default => 'Enterprise',
            };
            Log::warning("Access denied to feature '{$feature}' for shop {$shopDomain} (Active Plan: {$activePlan})");
            return response()->json([
                'success' => false,
                'error' => 'UPGRADE_REQUIRED',
                'required_plan' => $requiredPlan,
                'message' => "This feature requires the {$requiredPlan} plan or higher. Please upgrade your subscription."
            ], 403);
        }

        return $next($request);
    }

    /**
     * Resolve shop domain dynamically from request queries, headers, body, or referrer.
     */
    private function resolveShopDomain(Request $request): ?string
    {
        $shop = $request->query('shop') ?? $request->header('X-Shop-Domain');
        if (!$shop) {
            $shop = $request->input('shop_domain') ?? $request->input('shopDomain') ?? $request->input('shop');
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
