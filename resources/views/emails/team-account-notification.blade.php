<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ $headline }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 32px 12px;">
              <img src="{{ asset('images/logo/hori.png') }}" alt="TravelBoost" style="display: block; height: 34px; width: auto;">
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 8px;">
              <div style="font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #14b8a6;">TravelBoost Team Access</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 8px;">
              <h1 style="margin: 0; font-size: 28px; line-height: 1.2; font-weight: 800; color: #0f172a;">{{ $headline }}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #475569;">{{ $intro }}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 16px 18px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #64748b;">Account Details</div>
                  </td>
                </tr>
                @foreach ($details as $detail)
                  <tr>
                    <td style="width: 38%; padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #334155;">{{ $detail['label'] }}</td>
                    <td style="padding: 14px 18px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #0f172a;">{{ $detail['value'] }}</td>
                  </tr>
                @endforeach
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 24px;">
              <a href="{{ $loginUrl }}" style="display: inline-block; padding: 12px 22px; border-radius: 9999px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700;">Go to Company Login</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 10px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #475569;">
                {{ $closing ?: 'If you did not expect this change, please contact your company owner or TravelBoost support immediately.' }}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px 30px;">
              <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #94a3b8;">
                Company: {{ $company->name }}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
