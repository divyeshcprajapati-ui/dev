<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class ProcessShopifyWebhookJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $topic;
    protected $shopDomain;
    protected $webhookId;
    protected $payload;

    /**
     * Create a new job instance.
     */
    public function __construct(string $topic, string $shopDomain, ?string $webhookId, array $payload)
    {
        $this->topic = $topic;
        $this->shopDomain = $shopDomain;
        $this->webhookId = $webhookId;
        $this->payload = $payload;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        // 1. Idempotency Check (Prevent duplicate executions of same webhook event)
        if ($this->webhookId) {
            $lockKey = "shopify_webhook_processed:{$this->webhookId}";
            
            // Acquire a lock for 24 hours (86400 seconds)
            $isNewEvent = Cache::add($lockKey, true, 86400);
            
            if (!$isNewEvent) {
                Log::info("Duplicate Shopify webhook event skipped: {$this->webhookId} ({$this->topic})");
                return;
            }
        }

        // 2. Process Payload based on topic
        try {
            switch ($this->topic) {
                case 'companies/create':
                    $this->processCompanyRegistration();
                    break;
                case 'quotes/create':
                case 'quotes/update':
                    $this->processQuoteUpdate();
                    break;
                default:
                    Log::warning("Unhandled webhook topic in job: {$this->topic}");
            }
        } catch (\Exception $e) {
            Log::error("Error processing Shopify webhook {$this->webhookId} ({$this->topic}): " . $e->getMessage(), [
                'exception' => $e
            ]);
            
            // Release the lock on failure so it can be retried
            if (isset($lockKey)) {
                Cache::forget($lockKey);
            }
            
            throw $e;
        }
    }

    /**
     * Handle B2B company registration/creation webhook.
     */
    protected function processCompanyRegistration()
    {
        $companyName = $this->payload['name'] ?? 'Unknown Company';
        // Add application-specific processing logic here
        Log::info("Successfully processed company/create webhook for company: {$companyName} (Shop: {$this->shopDomain})");
    }

    /**
     * Handle quote creation and update webhooks.
     */
    protected function processQuoteUpdate()
    {
        $quoteId = $this->payload['id'] ?? 'Unknown Quote ID';
        $status = $this->payload['status'] ?? 'unknown';
        // Add application-specific processing logic here
        Log::info("Successfully processed quote webhook (ID: {$quoteId}, Status: {$status}) for Shop: {$this->shopDomain}");
    }
}
