<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="shopify-api-key" content="{{ config('shopify.api_key') }}">
    <title>Connecting to Shopify...</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f6f6f7;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            color: #202223;
        }

        .container {
            text-align: center;
            padding: 40px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            max-width: 400px;
            width: 90%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        /* Modern Spinner */
        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e1e3e5;
            border-top: 3px solid #008060; /* Shopify Green */
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 24px;
        }

        h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 8px 0;
            color: #202223;
        }

        p {
            font-size: 14px;
            color: #6d7175;
            margin: 0 0 16px 0;
        }

        /* Fallback Link (Fades in after 3 seconds) */
        .fallback {
            opacity: 0;
            font-size: 13px;
            animation: fadeIn 0.5s ease-out 3s forwards;
        }

        .fallback a {
            color: #008060;
            text-decoration: none;
            font-weight: 500;
        }

        .fallback a:hover {
            text-decoration: underline;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <script type="text/javascript">
        // Escape the iframe context for OAuth redirect
        const redirectUrl = "{{ $redirectUrl }}";
        if (window.top !== window.self) {
            try {
                window.top.location.replace(redirectUrl);
            } catch (e) {
                window.top.location.href = redirectUrl;
            }
        } else {
            window.location.replace(redirectUrl);
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Connecting to Shopify</h2>
        <p>Please wait while we secure your connection...</p>
        
        <div class="fallback">
            If you are not redirected automatically, <a href="{{ $redirectUrl }}" target="_top">click here</a>.
        </div>
    </div>
</body>
</html>
