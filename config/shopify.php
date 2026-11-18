<?php

return [
    'api_key' => env('SHOPIFY_API_KEY'),
    'api_secret' => env('SHOPIFY_API_SECRET'),
    'api_version' => env('SHOPIFY_API_VERSION', '2026-04'),
    'app_handle' => env('SHOPIFY_APP_HANDLE', 'b2bdev'),
    'billing_test' => filter_var(env('SHOPIFY_BILLING_TEST', env('APP_ENV', 'local') !== 'production'), FILTER_VALIDATE_BOOLEAN),
    'shop_domain' => env('SHOPIFY_SHOP_DOMAIN'),
    'access_token' => env('SHOPIFY_ACCESS_TOKEN'),
];
