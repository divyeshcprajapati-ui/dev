<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\B2BSubscription;

class B2BSubscriptionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Truncate existing entries first
        B2BSubscription::truncate();

        $modules = [
            // Free plan modules (all implemented features)
            [
                'subscription_key' => 'signupForm',
                'name' => 'Custom B2B sign-up registration form',
                'price' => 0.00,
                'description' => 'Customizable B2B wholesale registration form block',
                'plan_type' => 'free',
                'is_default' => true,
            ],
            [
                'subscription_key' => 'reviewApps',
                'name' => 'Review & approve buyer applications',
                'price' => 0.00,
                'description' => 'Review, approve, or reject wholesale registration submissions',
                'plan_type' => 'free',
                'is_default' => true,
            ],
            [
                'subscription_key' => 'manageAccounts',
                'name' => 'Shopify B2B company & metafield sync',
                'price' => 0.00,
                'description' => 'Sync approved applicants to Shopify Companies and Locations',
                'plan_type' => 'free',
                'is_default' => true,
            ],

            // Grow plan modules ($29/mo)
            [
                'subscription_key' => 'quoteGrow',
                'name' => 'Product Quotes (up to 25/mo) + Quick Order, CSV & Reorder',
                'price' => 29.00,
                'description' => 'Product page quote requests (25/month), Quick Order Pad, CSV Bulk Order, and 1-Click Reorder',
                'plan_type' => 'grow',
                'is_default' => true,
            ],

            // Advanced plan modules ($79/mo)
            [
                'subscription_key' => 'quoteAdv',
                'name' => 'Unlimited Multi-Item Quotes + Shopping Lists + Translations',
                'price' => 79.00,
                'description' => 'Unlimited multi-item cart quotes, expiration & Draft Order checkout, Reusable Shopping Lists, and Multi-Language Translations',
                'plan_type' => 'advanced',
                'is_default' => true,
            ],

            // Enterprise plan modules ($149/mo)
            [
                'subscription_key' => 'quotePlus',
                'name' => 'Full Suite: Flow + Team Roles + Credit Limit & Finance Ledger',
                'price' => 149.00,
                'description' => 'Everything in Advanced plus Shopify Flow automations, Buyer Team Roles, Credit Limits, and Finance Ledger Portal',
                'plan_type' => 'plus',
                'is_default' => true,
            ],
        ];

        foreach ($modules as $module) {
            B2BSubscription::create($module);
        }
    }
}
