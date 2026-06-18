<?php

namespace App\Services;

use App\Exceptions\WalGBackupException;
use Illuminate\Support\Facades\Process;

class WalGBackupService
{
    public function isConfigured(): bool
    {
        return filled(config('backup.wal_g.s3_prefix'))
            && filled(config('backup.wal_g.access_key_id'))
            && filled(config('backup.wal_g.secret_access_key'));
    }

    public function isRemoteConfigured(): bool
    {
        return filled(config('backup.remote.user'))
            && filled(config('backup.remote.host'));
    }

    /**
     * @return list<array{
     *     name: string,
     *     time: string|null,
     *     wal_file_name: string|null,
     *     hostname: string|null,
     *     pg_version: int|null,
     *     start_lsn: int|null,
     *     finish_lsn: int|null,
     *     is_permanent: bool,
     * }>
     */
    public function listBackups(): array
    {
        $output = $this->runWalG(['backup-list', '--detail', '--json']);

        /** @var list<array<string, mixed>>|null $decoded */
        $decoded = json_decode($output, true);

        if (! is_array($decoded)) {
            throw new WalGBackupException('Failed to parse WAL-G backup list.');
        }

        return array_map(function (array $backup): array {
            return [
                'name' => (string) ($backup['backup_name'] ?? ''),
                'time' => isset($backup['time']) ? (string) $backup['time'] : null,
                'wal_file_name' => isset($backup['wal_file_name']) ? (string) $backup['wal_file_name'] : null,
                'hostname' => isset($backup['hostname']) ? (string) $backup['hostname'] : null,
                'pg_version' => isset($backup['pg_version']) ? (int) $backup['pg_version'] : null,
                'start_lsn' => isset($backup['start_lsn']) ? (int) $backup['start_lsn'] : null,
                'finish_lsn' => isset($backup['finish_lsn']) ? (int) $backup['finish_lsn'] : null,
                'is_permanent' => (bool) ($backup['is_permanent'] ?? false),
            ];
        }, $decoded);
    }

    /**
     * @return array{
     *     active: bool,
     *     next_run: string|null,
     *     last_run: string|null,
     * }|null
     */
    public function getScheduleStatus(): ?array
    {
        if (! $this->isRemoteConfigured()) {
            return null;
        }

        $timer = config('backup.remote.backup_timer');
        $output = $this->runRemote("systemctl show {$timer} --property=ActiveState,NextElapseUSecRealtime,LastTriggerUSec");

        $properties = $this->parseSystemctlProperties($output);

        return [
            'active' => ($properties['ActiveState'] ?? '') === 'active',
            'next_run' => $this->formatSystemdTimestamp($properties['NextElapseUSecRealtime'] ?? null),
            'last_run' => $this->formatSystemdTimestamp($properties['LastTriggerUSec'] ?? null),
        ];
    }

    public function triggerBackup(): void
    {
        if (! $this->isRemoteConfigured()) {
            throw new WalGBackupException('Database SSH credentials are not configured.');
        }

        $service = config('backup.remote.backup_service');
        $this->runRemote("sudo systemctl start {$service}");
    }

    public function applyRetention(?int $count = null): void
    {
        $count ??= (int) config('backup.wal_g.retain_full');

        $this->runWalG([
            'delete',
            'retain',
            'FULL',
            (string) $count,
            '--confirm',
        ]);
    }

    /**
     * @param  list<string>  $arguments
     */
    private function runWalG(array $arguments): string
    {
        $binary = (string) config('backup.wal_g.binary');

        $process = Process::timeout(120)
            ->env($this->walGEnvironment())
            ->run(array_merge([$binary], $arguments));

        if (! $process->successful()) {
            throw new WalGBackupException(trim($process->errorOutput() ?: $process->output()));
        }

        return trim($process->output());
    }

    /**
     * @return array<string, string>
     */
    private function walGEnvironment(): array
    {
        $environment = [
            'WALG_S3_PREFIX' => (string) config('backup.wal_g.s3_prefix'),
            'AWS_ACCESS_KEY_ID' => (string) config('backup.wal_g.access_key_id'),
            'AWS_SECRET_ACCESS_KEY' => (string) config('backup.wal_g.secret_access_key'),
            'AWS_REGION' => (string) config('backup.wal_g.region'),
            'WALG_COMPRESSION_METHOD' => (string) config('backup.wal_g.compression_method'),
        ];

        if ($endpoint = config('backup.wal_g.endpoint')) {
            $environment['AWS_ENDPOINT'] = (string) $endpoint;
        }

        if (config('backup.wal_g.use_path_style')) {
            $environment['AWS_S3_FORCE_PATH_STYLE'] = 'true';
        }

        return $environment;
    }

    private function runRemote(string $command): string
    {
        $target = sprintf(
            '%s@%s',
            config('backup.remote.user'),
            config('backup.remote.host'),
        );

        $process = Process::timeout(120)
            ->run($this->buildRemoteSshCommand($target, $command));

        if (! $process->successful()) {
            throw new WalGBackupException(trim($process->errorOutput() ?: $process->output()));
        }

        return trim($process->output());
    }

    /**
     * @return list<string>
     */
    private function buildRemoteSshCommand(string $target, string $command): array
    {
        $sshCommand = array_merge($this->sshArguments(), [$target, $command]);

        if ($runAs = config('backup.remote.run_as')) {
            return array_merge(['sudo', '-n', '-u', (string) $runAs, '--'], $sshCommand);
        }

        return $sshCommand;
    }

    /**
     * @return list<string>
     */
    private function sshArguments(): array
    {
        $arguments = [
            'ssh',
            '-o',
            'BatchMode=yes',
            '-o',
            'StrictHostKeyChecking=accept-new',
        ];

        if ($knownHostsFile = config('backup.remote.known_hosts_file')) {
            $arguments[] = '-o';
            $arguments[] = 'UserKnownHostsFile='.(string) $knownHostsFile;
        }

        if ($identityFile = config('backup.remote.identity_file')) {
            $arguments[] = '-i';
            $arguments[] = (string) $identityFile;
        }

        return $arguments;
    }

    /**
     * @return array<string, string>
     */
    private function parseSystemctlProperties(string $output): array
    {
        $properties = [];

        foreach (explode("\n", $output) as $line) {
            if (! str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $properties[trim($key)] = trim($value);
        }

        return $properties;
    }

    private function formatSystemdTimestamp(?string $value): ?string
    {
        if ($value === null || $value === '' || $value === 'n/a') {
            return null;
        }

        if (! is_numeric($value)) {
            return $value;
        }

        $timestamp = (int) floor(((int) $value) / 1_000_000);

        if ($timestamp <= 0) {
            return null;
        }

        return date('c', $timestamp);
    }
}
