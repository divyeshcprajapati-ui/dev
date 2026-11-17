<?php

namespace App\Jobs;

use App\Models\B2BApplication;
use App\Traits\HasShopifyApi;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Dispatched with ->afterResponse() so the Shopify Flow trigger
 * (which can take 5–15s) runs AFTER the HTTP response is flushed to the
 * browser — the customer sees the success screen immediately.
 */
class TriggerB2BRegistrationFlow implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels, HasShopifyApi;

    public int $applicationId;
    public string $shopDomain;

    public function __construct(int $applicationId, string $shopDomain)
    {
        $this->applicationId = $applicationId;
        $this->shopDomain    = $shopDomain;
    }

    public function handle(): void
    {
        $application = B2BApplication::find($this->applicationId);
        if (!$application) {
            Log::warning("[TriggerB2BRegistrationFlow] Application ID {$this->applicationId} not found. Skipping.");
            return;
        }

        try {
            $this->runFlowTrigger($application, $this->shopDomain);
        } catch (\Exception $e) {
            Log::error('[TriggerB2BRegistrationFlow] Exception: ' . $e->getMessage());
        }
    }

    private function runFlowTrigger(B2BApplication $application, string $shopDomain): void
    {
        $mutation = '
        mutation flowTriggerReceive($handle: String!, $payload: JSON!) {
          flowTriggerReceive(handle: $handle, payload: $payload) {
            userErrors { field message }
          }
        }';

        $customerId = $application->shopify_customer_id;

        if (!$customerId && !empty($application->email)) {
            $customerId = $this->getShopifyCustomerIdByEmail($application->email, $shopDomain);
        }
        if (!$customerId) {
            $customerId = $this->getFirstShopifyCustomerId($shopDomain);
        }
        if (!$customerId) {
            $existing = B2BApplication::where('shop_domain', $shopDomain)
                ->whereNotNull('shopify_customer_id')
                ->where('shopify_customer_id', '!=', '')
                ->first();
            if ($existing) $customerId = $existing->shopify_customer_id;
        }
        if (!$customerId) {
            $customerId = 'gid://shopify/Customer/1';
        }

        $numericId = null;
        if ($customerId && $customerId !== 'gid://shopify/Customer/1') {
            if (preg_match('/\/([0-9]+)$/', $customerId, $m)) {
                $numericId = (int) $m[1];
            } elseif (is_numeric($customerId)) {
                $numericId = (int) $customerId;
            }
        }

        $shopName = explode('.', $shopDomain)[0];
        $appLink  = "https://admin.shopify.com/store/{$shopName}/apps/b2bdev/customers/{$application->id}";

        $payload = [
            'Your field key'   => "New B2B registration submitted by: {$application->first_name} {$application->last_name} ({$application->company_name})",
            'customer name'    => "{$application->first_name} {$application->last_name}",
            'company name'     => $application->company_name,
            'email'            => $application->email,
            'application link' => $appLink,
            'customer_id'      => $numericId,
        ];

        Log::info('[TriggerB2BRegistrationFlow] Triggering Shopify Flow', ['shop' => $shopDomain, 'payload' => $payload]);

        $res = $this->queryShopifyGraphQL($mutation, [
            'handle'  => 'b2b-registration-form-submitted',
            'payload' => $payload,
        ], $shopDomain);

        if (!$res['success']) {
            Log::error('[TriggerB2BRegistrationFlow] Flow failed: ' . json_encode($res['errors'] ?? $res['error'] ?? 'Unknown'));
        } else {
            $userErrors = $res['data']['flowTriggerReceive']['userErrors'] ?? [];
            if (!empty($userErrors)) {
                Log::error('[TriggerB2BRegistrationFlow] Flow userErrors: ' . json_encode($userErrors));
            } else {
                Log::info('[TriggerB2BRegistrationFlow] Successfully triggered Shopify Flow b2b-registration-form-submitted.');
            }
        }
    }
}

