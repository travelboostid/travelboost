<?php

use App\Services\WalGBackupService;
use Illuminate\Process\PendingProcess;
use Illuminate\Support\Facades\Process;

test('remote ssh runs as configured deploy user on app server', function () {
    config([
        'backup.remote.user' => 'travelboost',
        'backup.remote.host' => '103.93.160.139',
        'backup.remote.run_as' => 'travelboost',
        'backup.remote.identity_file' => null,
        'backup.remote.known_hosts_file' => null,
        'backup.remote.backup_timer' => 'wal-g-backup.timer',
    ]);

    Process::fake([
        '*' => Process::result("ActiveState=active\nNextElapseUSecRealtime=n/a\nLastTriggerUSec=n/a"),
    ]);

    app(WalGBackupService::class)->getScheduleStatus();

    Process::assertRan(function (PendingProcess $process): bool {
        $command = $process->command;

        return is_array($command)
            && $command[0] === 'sudo'
            && $command[1] === '-n'
            && $command[2] === '-u'
            && $command[3] === 'travelboost'
            && in_array('ssh', $command, true)
            && in_array('travelboost@103.93.160.139', $command, true);
    });
});

test('remote ssh runs directly when run as user is not configured', function () {
    config([
        'backup.remote.user' => 'travelboost',
        'backup.remote.host' => '103.93.160.139',
        'backup.remote.run_as' => null,
        'backup.remote.identity_file' => null,
        'backup.remote.known_hosts_file' => null,
        'backup.remote.backup_timer' => 'wal-g-backup.timer',
    ]);

    Process::fake([
        '*' => Process::result("ActiveState=inactive\nNextElapseUSecRealtime=n/a\nLastTriggerUSec=n/a"),
    ]);

    app(WalGBackupService::class)->getScheduleStatus();

    Process::assertRan(function (PendingProcess $process): bool {
        $command = $process->command;

        return is_array($command)
            && $command[0] === 'ssh'
            && ! in_array('sudo', $command, true)
            && in_array('travelboost@103.93.160.139', $command, true);
    });
});
