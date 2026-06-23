<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Redirecting...</title>
    <script type="text/javascript">
        // Escape the iframe context for OAuth redirect
        window.top.location.href = "{{ $redirectUrl }}";
    </script>
</head>
<body>
    <p>Redirecting to Shopify authorization... If you are not redirected automatically, <a href="{{ $redirectUrl }}" target="_top">click here</a>.</p>
</body>
</html>
