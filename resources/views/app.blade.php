<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>B2B Hub</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f2f4; font-family: 'Inter', sans-serif;">
        <div id="app"></div>
    </body>
</html>
