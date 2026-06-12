<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <title>{{ $title ?? 'Report' }}</title>
    <style>
        body {
            font-family:
                DejaVu Sans,
                Arial,
                sans-serif;
            color: #0f172a;
            margin: 24px;
            font-size: 12px;
        }
        .header {
            margin-bottom: 18px;
        }
        .title {
            font-size: 20px;
            font-weight: 700;
            margin: 0 0 4px;
        }
        .subtitle {
            color: #475569;
            margin: 0;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            table-layout: auto;
        }
        th,
        td {
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            text-align: left;
            vertical-align: top;
            word-break: break-word;
        }
        th {
            background: #e2e8f0;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }
        tr:nth-child(even) td {
            background: #f8fafc;
        }
        .empty {
            text-align: center;
            color: #64748b;
        }
        @media print {
            body {
                margin: 12px;
                font-size: 10px;
            }
            .title {
                font-size: 16px;
            }
            th,
            td {
                padding: 5px 6px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">{{ $title ?? 'Report' }}</h1>
        @if (!empty($subtitle))
            <p class="subtitle">{{ $subtitle }}</p>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                @foreach (($columns ?? []) as $column)
                    <th>{{ $column }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse (($rows ?? []) as $row)
                <tr>
                    @foreach (($columns ?? []) as $column)
                        <td>{{ data_get($row, $column, '-') }}</td>
                    @endforeach
                </tr>
            @empty
                <tr>
                    <td
                        colspan="{{ max(1, count($columns ?? [])) }}"
                        class="empty"
                    >
                        No data available.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    @if (!empty($autoPrint))
        <script>
            window.addEventListener('load', function () {
                window.print();
            });
        </script>
    @endif
</body>
</html>
