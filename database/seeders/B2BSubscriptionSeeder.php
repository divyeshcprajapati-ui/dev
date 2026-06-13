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
            // Free plan modules
            [
                'subscription_key' => 'manageAccounts',
                'name' => 'Create & manage B2B company accounts',
                'price' => 0.00,
                'description' => 'Create & manage B2B company accounts',
                'plan_type' => 'free',
                'is_default' => true,
            ],
            [
                'subscription_key' => 'teamRoles',
                'name' => 'Buyer team roles & permission control',
                'price' => 0.00,
                'description' => 'Buyer team roles & permission control',
                'plan_type' => 'free',
                'is_default' => true,
            ],
            [
                'subscription_key' => 'signupForm',
                'name' => 'Custom B2B sign-up registration form',
                'price' => 0.00,
                'description' => 'Custom B2B sign-up registration form',
                'plan_type' => 'free',
                'is_default' => true,
            ],
            [
                'subscription_key' => 'reviewApps',
                'name' => 'Review & approve buyer applications',
                'price' => 0.00,
                'description' => 'Review & approve buyer applications',
                'plan_type' => 'free',
                'is_default' => true,
            ],

            // Grow plan modules
            [
                'subscription_key' => 'quoteGrow',
                'name' => 'B2B quote request & negotiation',
                'price' => 19.00,
                'description' => 'Quote request and price negotiations',
                'plan_type' => 'grow',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'orderGrow',
                'name' => 'Quick bulk order via CSV & SKU',
                'price' => 29.00,
                'description' => 'Support buyers order and re-order quickly',
                'plan_type' => 'grow',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'listGrow',
                'name' => 'Reusable B2B shopping lists',
                'price' => 49.00,
                'description' => 'Manage B2B shopping lists',
                'plan_type' => 'grow',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'financeGrow',
                'name' => 'B2B finance, credit & ledger',
                'price' => 69.00,
                'description' => 'Manage B2B credit accounts',
                'plan_type' => 'grow',
                'is_default' => false,
            ],

            // Advanced plan modules
            [
                'subscription_key' => 'quoteAdv',
                'name' => 'B2B quote request & negotiation',
                'price' => 39.00,
                'description' => 'Quote request and price negotiations',
                'plan_type' => 'advanced',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'orderAdv',
                'name' => 'Quick bulk order via CSV & SKU',
                'price' => 49.00,
                'description' => 'Support buyers order and re-order quickly',
                'plan_type' => 'advanced',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'listAdv',
                'name' => 'Reusable B2B shopping lists',
                'price' => 69.00,
                'description' => 'Manage B2B shopping lists',
                'plan_type' => 'advanced',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'financeAdv',
                'name' => 'B2B finance, credit & ledger',
                'price' => 99.00,
                'description' => 'Manage B2B credit accounts',
                'plan_type' => 'advanced',
                'is_default' => false,
            ],

            // Plus plan modules
            [
                'subscription_key' => 'quotePlus',
                'name' => 'B2B quote request & negotiation',
                'price' => 69.00,
                'description' => 'Quote request and price negotiations',
                'plan_type' => 'plus',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'orderPlus',
                'name' => 'Quick bulk order via CSV & SKU',
                'price' => 79.00,
                'description' => 'Support buyers order and re-order quickly',
                'plan_type' => 'plus',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'listPlus',
                'name' => 'Reusable B2B shopping lists',
                'price' => 99.00,
                'description' => 'Manage B2B shopping lists',
                'plan_type' => 'plus',
                'is_default' => false,
            ],
            [
                'subscription_key' => 'financePlus',
                'name' => 'B2B finance, credit & ledger',
                'price' => 149.00,
                'description' => 'Manage B2B credit accounts',
                'plan_type' => 'plus',
                'is_default' => false,
            ],
        ];

        foreach ($modules as $module) {
            B2BSubscription::create($module);
        }
    }
}
