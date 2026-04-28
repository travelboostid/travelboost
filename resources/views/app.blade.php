<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  {{-- Inline script to detect system dark mode preference and apply it immediately --}}
  <script>
    (function() {
      const appearance = '{{ $appearance ?? "system" }}';

      if (appearance === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (prefersDark) {
          document.documentElement.classList.add('dark');
        }
      }
    })();
  </script>
  <script src="https://app.sandbox.midtrans.com/snap/snap.js"
    data-client-key="{{ config('midtrans.client_key') }}"></script>

  {{-- Inline style to set the HTML background color based on our theme in app.css --}}
  <style>
    html {
      background-color: oklch(1 0 0);
    }

    html.dark {
      background-color: oklch(0.145 0 0);
    }
  </style>

  <title inertia>{{ config('app.name', 'Travelboost') }}</title>

  <link rel="icon" href="/images/logo/logo-square/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" sizes="32x32" href="/images/logo/logo-square/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/images/logo/logo-square/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/images/logo/logo-square/apple-touch-icon.png">
  <link rel="manifest" href="/images/logo/logo-square/site.webmanifest">

  <link rel="preconnect" href="https://fonts.bunny.net">
  <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

  @viteReactRefresh
  @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
  @inertiaHead
</head>

<body class="font-sans antialiased">
  @inertia
</body>

</html>