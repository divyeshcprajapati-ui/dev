<?php

namespace App\Console\Commands;

use App\Models\ShopifyShop;
use App\Traits\HasShopifyApi;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ShopifyMigrateExpiringTokens extends Command
{
    use HasShopifyApi;

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shopify:migrate-tokens {--shop= : Specific shop domain to migrate} {--force : Force migration even if already expiring}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate Shopify shops from legacy permanent offline access tokens to modern expiring offline tokens with refresh tokens';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $shopFilter = $this->option('shop');
        $force = $this->option('force');

        $query = ShopifyShop::query();
        if ($shopFilter) {
            $query->where('shop_domain', $shopFilter);
        }

        $shops = $query->get();

        if ($shops->isEmpty()) {
            $this->warn('No shops found matching criteria.');
            return 0;
        }

        $this->info("Found {$shops->count()} shop(s) to inspect for token migration.");

        $migratedCount = 0;
        $skippedCount = 0;
        $failedCount = 0;

        foreach ($shops as $shop) {
            // Check if already using expiring token
            if (!$force && $shop->refresh_token && $shop->expires_at) {
                $this->line(" - [SKIPPED] {$shop->shop_domain}: Already has expiring token and refresh_token.");
                $skippedCount++;
                continue;
            }

            if (!$shop->access_token) {
                $this->line(" - [SKIPPED] {$shop->shop_domain}: No access token available.");
                $skippedCount++;
                continue;
            }

            $this->info(" - [MIGRATING] {$shop->shop_domain} via Token Exchange...");

            $exchangeData = $this->migrateLegacyOfflineToken($shop->shop_domain, $shop->access_token);

            if ($exchangeData && isset($exchangeData['access_token'])) {
                $newAccessToken = $exchangeData['access_token'];
                $refreshToken = $exchangeData['refresh_token'] ?? null;
                $expiresIn = $exchangeData['expires_in'] ?? null;
                $expiresAt = $expiresIn ? now()->addSeconds($expiresIn - 60) : null;

                $shop->update([
                    'access_token' => $newAccessToken,
                    'refresh_token' => $refreshToken,
                    'expires_at' => $expiresAt,
                ]);

                $this->info("   -> SUCCESS: Successfully migrated {$shop->shop_domain} to expiring token (expires in {$expiresIn}s).");
                Log::info("Successfully migrated shop {$shop->shop_domain} to expiring offline token via artisan command.");
                $migratedCount++;
            } else {
                $this->error("   -> FAILED: Unable to migrate {$shop->shop_domain}. Old token preserved.");
                Log::error("Failed to migrate shop {$shop->shop_domain} to expiring offline token via artisan command.");
                $failedCount++;
            }
        }

        $this->newLine();
        $this->info("Token Migration Completed: {$migratedCount} migrated, {$skippedCount} skipped, {$failedCount} failed.");

        return 0;
    }
}

