<?php

namespace App\Http\Controllers;

use App\Models\ShopifyShop;
use App\Traits\HasShopifyApi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShopifyBillingController extends Controller
{
    use HasShopifyApi;

    /**
     * Handle Shopify Billing charge approval/decline redirect.
     */
    public function billingCallback(Request $request)
    {
        $shopDomain = $request->query('shop');
        $chargeId = $request->query('charge_id');
        $plan = $request->query('plan', 'free');
        $modulesString = $request->query('modules', '');
        $modules = $modulesString ? explode(',', $modulesString) : [];

        if (!$shopDomain || !$chargeId) {
            Log::error('Shopify billing callback missing required parameters.', [
                'shop' => $shopDomain,
                'charge_id' => $chargeId
            ]);
            return redirect('/');
        }

        $shop = ShopifyShop::where('shop_domain', $shopDomain)->first();
        if (!$shop) {
            Log::error("Shop not found during billing callback: {$shopDomain}");
            return redirect('/');
        }

        // Verify charge status via GraphQL
        $query = '
        query getSubscription($id: ID!) {
          node(id: $id) {
            ... on AppSubscription {
              id
              status
              name
            }
          }
        }';

        // Check if charge ID is fully formatted as GID
        $chargeGid = str_contains($chargeId, 'gid://') ? $chargeId : "gid://shopify/AppSubscription/{$chargeId}";

        $res = $this->queryShopifyGraphQL($query, ['id' => $chargeGid], $shopDomain);

        $isActivated = false;

        if ($res['success'] && isset($res['data']['node'])) {
            $subscription = $res['data']['node'];
            $status = $subscription['status'] ?? 'DECLINED';

            if ($status === 'ACTIVE') {
                $shop->active_plan = $plan;
                $shop->selected_modules = $modules;
                $shop->save();
                
                $isActivated = true;
                Log::info("Successfully activated subscription {$chargeId} for shop {$shopDomain} (Plan: {$plan})");
            } else {
                Log::warning("Subscription charge {$chargeId} was not approved. Status: {$status}");
            }
        } else {
            Log::error("Failed to query subscription charge status from Shopify for shop {$shopDomain}");
        }

        // Redirect back to Shopify Admin app dashboard
        $apiKey = config('shopify.api_key');
        
        // If billing failed, we can redirect back with a status parameter so the frontend knows to show an error
        $statusParam = $isActivated ? 'success' : 'failed';
        $redirectUrl = "https://{$shopDomain}/admin/apps/{$apiKey}?billing_status={$statusParam}";

        return view('iframe_redirect', ['redirectUrl' => $redirectUrl]);
    }
}
