@php
    $emailTitle = $title ?? $headline ?? 'TravelBoost';
    $preheaderText = $preheader ?? $intro ?? $headline ?? 'TravelBoost notification';
    $emailEyebrow = $eyebrow ?? 'TravelBoost Update';
    $emailHeadline = $headline ?? 'TravelBoost Notification';
    $emailIntro = $intro ?? '';
    $emailDetails = $details ?? [];
    $emailDetailsTitle = $detailsTitle ?? 'Details';
    $emailActionLabel = $actionLabel ?? null;
    $emailActionUrl = $actionUrl ?? null;
    $emailClosing = $closing ?? null;
    $logoUrl = rtrim((string) config('app.url'), '/').'/images/logo/hori.png';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ $emailTitle }}</title>
</head>
<body
    style="
        margin: 0;
        padding: 0;
        background-color: #f8fafc;
        font-family: Arial, Helvetica, sans-serif;
        color: #0f172a;
    "
>
    <div
        style="
            display: none;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            mso-hide: all;
            color: transparent;
        "
    >
        {{ $preheaderText }}
    </div>

    <table
        role="presentation"
        width="100%"
        cellspacing="0"
        cellpadding="0"
        style="background-color: #f8fafc; padding: 24px 12px"
    >
        <tr>
            <td align="center">
                <table
                    role="presentation"
                    width="100%"
                    cellspacing="0"
                    cellpadding="0"
                    style="
                        max-width: 640px;
                        background-color: #ffffff;
                        border: 1px solid #e2e8f0;
                        border-radius: 18px;
                        overflow: hidden;
                    "
                >
                    <tr>
                        <td style="padding: 28px 32px 12px">
                            <img
                                src="{{ $logoUrl }}"
                                alt="TravelBoost"
                                style="
                                    display: block;
                                    height: 34px;
                                    width: auto;
                                    border: 0;
                                    outline: none;
                                    text-decoration: none;
                                "
                            />
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 8px">
                            <div
                                style="
                                    font-size: 12px;
                                    font-weight: 700;
                                    letter-spacing: 0.14em;
                                    text-transform: uppercase;
                                    color: #14b8a6;
                                "
                            >
                                {{ $emailEyebrow }}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 0 32px 8px">
                            <h1
                                style="
                                    margin: 0;
                                    font-size: 28px;
                                    line-height: 1.2;
                                    font-weight: 800;
                                    color: #0f172a;
                                "
                            >
                                {{ $emailHeadline }}
                            </h1>
                        </td>
                    </tr>
                    @if ($emailIntro !== '')
                        <tr>
                            <td style="padding: 0 32px 24px">
                                <p
                                    style="
                                        margin: 0;
                                        font-size: 15px;
                                        line-height: 1.7;
                                        color: #475569;
                                    "
                                >{{ $emailIntro }}</p>
                            </td>
                        </tr>
                    @endif
                    @if (! empty($emailDetails))
                        <tr>
                            <td style="padding: 0 32px 24px">
                                <table
                                    role="presentation"
                                    width="100%"
                                    cellspacing="0"
                                    cellpadding="0"
                                    style="
                                        border-collapse: separate;
                                        border-spacing: 0;
                                        border: 1px solid #e2e8f0;
                                        border-radius: 16px;
                                        overflow: hidden;
                                    "
                                >
                                    <tr>
                                        <td
                                            colspan="2"
                                            style="
                                                padding: 16px 18px;
                                                background-color: #f8fafc;
                                                border-bottom: 1px solid #e2e8f0;
                                            "
                                        >
                                            <div
                                                style="
                                                    font-size: 11px;
                                                    font-weight: 700;
                                                    letter-spacing: 0.14em;
                                                    text-transform: uppercase;
                                                    color: #64748b;
                                                "
                                            >
                                                {{ $emailDetailsTitle }}
                                            </div>
                                        </td>
                                    </tr>
                                    @foreach ($emailDetails as $detail)
                                        <tr>
                                            <td
                                                style="
                                                    width: 38%;
                                                    padding: 14px 18px;
                                                    border-bottom: 1px solid
                                                        #e2e8f0;
                                                    font-size: 13px;
                                                    font-weight: 700;
                                                    color: #334155;
                                                "
                                            >
                                                {{ $detail['label'] }}
                                            </td>
                                            <td
                                                style="
                                                    padding: 14px 18px;
                                                    border-bottom: 1px solid
                                                        #e2e8f0;
                                                    font-size: 13px;
                                                    color: #0f172a;
                                                "
                                            >
                                                {{ $detail['value'] }}
                                            </td>
                                        </tr>
                                    @endforeach
                                </table>
                            </td>
                        </tr>
                    @endif
                    @if ($emailActionLabel && $emailActionUrl)
                        <tr>
                            <td style="padding: 0 32px 24px">
                                <a
                                    href="{{ $emailActionUrl }}"
                                    style="
                                        display: inline-block;
                                        padding: 12px 22px;
                                        border-radius: 9999px;
                                        background-color: #0f172a;
                                        color: #ffffff;
                                        text-decoration: none;
                                        font-size: 14px;
                                        font-weight: 700;
                                    "
                                    >{{ $emailActionLabel }}</a
                                >
                            </td>
                        </tr>
                    @endif
                    @if ($emailClosing)
                        <tr>
                            <td style="padding: 0 32px 30px">
                                <p
                                    style="
                                        margin: 0;
                                        font-size: 13px;
                                        line-height: 1.7;
                                        color: #475569;
                                    "
                                >{{ $emailClosing }}</p>
                            </td>
                        </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
