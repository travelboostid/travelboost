<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <script>
        (function () {
            const appearance = '{{ $appearance ?? "system" }}';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia(
                    '(prefers-color-scheme: dark)',
                ).matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>
    @if (! empty($analyticsMeasurementIds))
        <script
            async
            src="https://www.googletagmanager.com/gtag/js?id={{ $analyticsMeasurementIds[0] }}"
        ></script>
        <script>
            window.dataLayer = window.dataLayer || [];

            function gtag() {
                dataLayer.push(arguments);
            }

            window.gtag = gtag;

            gtag('js', new Date());

            const measurementIds = @json ($analyticsMeasurementIds);

            measurementIds.forEach((id) => {
                gtag('config', id, {
                    send_page_view: false,
                });
            });
        </script>
    @endif

    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Travelboost') }}</title>

    <link rel="icon" href="/images/logo/logo-square/favicon.ico" sizes="any" />
    <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/images/logo/logo-square/favicon-32x32.png"
    />
    <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/images/logo/logo-square/favicon-16x16.png"
    />
    <link
        rel="apple-touch-icon"
        href="/images/logo/logo-square/apple-touch-icon.png"
    />
    <link rel="manifest" href="/images/logo/logo-square/site.webmanifest" />

    <link
        rel="preconnect"
        href="https://fonts.bunny.net"
        crossorigin="anonymous"
    />
    <link
        href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600|playfair-display:600,700&display=swap"
        rel="stylesheet"
    />

    @php
        $performancePreloads = \App\Support\PerformanceHints::forInertiaPage(
            $page['component'] ?? null,
            $tenantLandingPageData ?? null,
        );
    @endphp
    @foreach ($performancePreloads as $hint)
        <link
            rel="preload"
            href="{{ $hint['href'] }}"
            as="{{ $hint['as'] }}"
            @if (! empty($hint['type'])) type="{{ $hint['type'] }}" @endif
            @if ($loop->first) fetchpriority="high" @endif
        />
    @endforeach

    @viteReactRefresh
    @vite (['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>
</html>
