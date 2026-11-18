<?php

namespace App\Services;

use App\Mail\B2BNotificationMail;
use App\Models\B2BNotificationSetting;
use App\Models\ShopifyShop;
use App\Traits\HasShopifyApi;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class B2BNotificationService
{
    use HasShopifyApi;

    /**
     * Check whether a notification setting is enabled for a shop.
     */
    public function isEnabled(string $shopDomain, string $settingKey): bool
    {
        $setting = B2BNotificationSetting::where('shop_domain', $shopDomain)
            ->where('setting_key', $settingKey)
            ->first();

        if ($setting) {
            return (bool) $setting->is_enabled;
        }

        // Defaults for core notifications if not yet seeded for the shop
        $defaultEnabled = [
            'b2b_submission_received',
            'b2b_submission_approved',
            'quote_submitted',
            'quote_accepted',
            'quote_auto_response',
            'member_added',
        ];

        return in_array($settingKey, $defaultEnabled, true);
    }

    /**
     * Resolve merchant staff email (cached on ShopifyShop or queried from Shopify GraphQL).
     */
    public function resolveStaffEmail(string $shopDomain): ?string
    {
        $shop = ShopifyShop::where('shop_domain', $shopDomain)->first();
        if ($shop && !empty($shop->staff_email)) {
            return $shop->staff_email;
        }

        $query = 'query { shop { email name } }';
        $res = $this->queryShopifyGraphQL($query, [], $shopDomain);

        if ($res['success'] && !empty($res['data']['shop'])) {
            $email = $res['data']['shop']['email'] ?? null;
            $name = $res['data']['shop']['name'] ?? null;
            if ($shop) {
                if ($email) $shop->staff_email = $email;
                if ($name && empty($shop->shop_name)) $shop->shop_name = $name;
                $shop->save();
            }
            return $email;
        }

        return config('mail.from.address');
    }

    /**
     * Resolve friendly store name for email branding.
     */
    public function resolveStoreName(string $shopDomain): string
    {
        $shop = ShopifyShop::where('shop_domain', $shopDomain)->first();
        if ($shop && !empty($shop->shop_name)) {
            return $shop->shop_name;
        }

        return ucfirst(explode('.', $shopDomain)[0] ?? 'B2B Hub');
    }

    /**
     * Send a notification email if the corresponding setting key is enabled.
     */
    public function sendIfEnabled(
        string $shopDomain,
        string $settingKey,
        ?string $recipientEmail,
        string $subject,
        string $headline,
        array $lines,
        ?string $actionLabel = null,
        ?string $actionUrl = null
    ): bool {
        if (!$shopDomain || !$this->isEnabled($shopDomain, $settingKey)) {
            return false;
        }

        if (!$recipientEmail || !filter_var($recipientEmail, FILTER_VALIDATE_EMAIL)) {
            Log::info("[B2BNotificationService] Skipping '{$settingKey}' for {$shopDomain}: invalid or missing recipient email.");
            return false;
        }

        try {
            $storeName = $this->resolveStoreName($shopDomain);
            Mail::to($recipientEmail)->send(new B2BNotificationMail(
                $subject,
                $headline,
                $lines,
                $actionLabel,
                $actionUrl,
                $storeName
            ));

            Log::info("[B2BNotificationService] Sent '{$settingKey}' email to {$recipientEmail} (shop: {$shopDomain})");
            return true;
        } catch (Exception $e) {
            Log::warning("[B2BNotificationService] Failed sending '{$settingKey}' email to {$recipientEmail}: " . $e->getMessage());
            return false;
        }
    }
}
