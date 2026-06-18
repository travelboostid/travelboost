<?php

namespace App\Http\Controllers\Admin;

use App\Exceptions\WalGBackupException;
use App\Http\Controllers\Controller;
use App\Services\WalGBackupService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BackupController extends Controller
{
    public function index(WalGBackupService $backups): Response
    {
        $error = null;
        $backupList = [];
        $schedule = null;

        if ($backups->isConfigured()) {
            try {
                $backupList = $backups->listBackups();
                $schedule = $backups->getScheduleStatus();
            } catch (WalGBackupException $exception) {
                $error = $exception->getMessage();
            }
        }

        return Inertia::render('admin/settings/backups/index', [
            'configured' => $backups->isConfigured(),
            'remoteConfigured' => $backups->isRemoteConfigured(),
            's3Prefix' => config('backup.wal_g.s3_prefix'),
            'retainFull' => (int) config('backup.wal_g.retain_full'),
            'backups' => $backupList,
            'schedule' => $schedule,
            'error' => $error,
        ]);
    }

    public function store(WalGBackupService $backups): RedirectResponse
    {
        if (! $backups->isRemoteConfigured()) {
            return back()->with('error', 'Database SSH credentials are not configured.');
        }

        try {
            $backups->triggerBackup();
        } catch (WalGBackupException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Backup job started on the database server.');
    }

    public function applyRetention(WalGBackupService $backups): RedirectResponse
    {
        if (! $backups->isConfigured()) {
            return back()->with('error', 'WAL-G backup storage is not configured.');
        }

        try {
            $backups->applyRetention();
        } catch (WalGBackupException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'Backup retention policy applied successfully.');
    }
}
