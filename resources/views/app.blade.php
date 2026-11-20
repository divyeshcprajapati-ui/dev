<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>B2B Hub</title>

        <link rel="icon" type="image/png" sizes="32x32" href="{{ asset('favicon-32x32.png') }}">
        <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="apple-touch-icon" href="{{ asset('b2b_app_icon.png') }}">

        <meta name="shopify-api-key" content="{{ config('shopify.api_key') }}">
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f2f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <div id="app"></div>
    </body>
</html>
