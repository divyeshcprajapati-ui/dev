<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $emailSubject }}</title>
</head>
<body style="margin:0;padding:0;background-color:#f6f6f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#202223;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #e1e3e5;overflow:hidden;">
                    <tr>
                        <td style="background:#008060;padding:24px 32px;color:#ffffff;">
                            <h1 style="margin:0;font-size:20px;font-weight:700;">{{ $storeName }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <h2 style="margin:0 0 16px 0;font-size:18px;color:#202223;">{{ $headline }}</h2>
                            @foreach($lines as $line)
                                <p style="margin:0 0 12px 0;font-size:14px;line-height:1.6;color:#4a4a4a;">{{ $line }}</p>
                            @endforeach

                            @if($actionLabel && $actionUrl)
                                <div style="margin-top:24px;">
                                    <a href="{{ $actionUrl }}" style="display:inline-block;padding:12px 24px;background:#008060;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
                                        {{ $actionLabel }}
                                    </a>
                                </div>
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e1e3e5;font-size:12px;color:#6d7175;">
                            Sent automatically by {{ $storeName }} B2B Portal.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
