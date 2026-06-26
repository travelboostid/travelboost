<?php

namespace App\Console\Commands;

use App\Support\PublicStorage;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use League\Flysystem\Local\LocalFilesystemAdapter;

#[Signature('media:refresh-cache-headers {prefix=images/ : Object key prefix to scan} {--dry-run : List objects without updating metadata}')]
#[Description('Backfill Cache-Control headers on existing public media objects')]
class RefreshMediaCacheHeadersCommand extends Command
{
    public function handle(): int
    {
        $disk = Storage::disk('public');
        $adapter = $disk->getAdapter();

        if ($adapter instanceof LocalFilesystemAdapter) {
            $this->components->info('Public disk is local; Cache-Control is served by the web server.');

            return self::SUCCESS;
        }

        $prefix = (string) $this->argument('prefix');
        $paths = $disk->allFiles($prefix);
        $updated = 0;
        $dryRun = (bool) $this->option('dry-run');

        foreach ($paths as $path) {
            if (! $this->shouldRefreshPath($path)) {
                continue;
            }

            if ($dryRun) {
                $this->line($path);

                continue;
            }

            $contents = $disk->get($path);

            if ($contents === null) {
                continue;
            }

            $disk->put($path, $contents, PublicStorage::uploadOptions());
            $updated++;
        }

        $this->components->info($dryRun
            ? sprintf('Found %d refreshable object(s) under %s.', count(array_filter($paths, fn (string $path): bool => $this->shouldRefreshPath($path))), $prefix)
            : sprintf('Updated Cache-Control on %d object(s).', $updated));

        return self::SUCCESS;
    }

    private function shouldRefreshPath(string $path): bool
    {
        return (bool) preg_match('/\.(avif|gif|jpe?g|png|svg|webp)$/i', $path);
    }
}
