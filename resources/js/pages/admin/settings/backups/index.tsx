import AdminLayout from '@/components/layouts/admin-dashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Head, router, usePage } from '@inertiajs/react';
import dayjs from 'dayjs';
import { DatabaseBackup, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type BackupRow = {
    name: string;
    time: string | null;
    wal_file_name: string | null;
    hostname: string | null;
    pg_version: number | null;
    start_lsn: number | null;
    finish_lsn: number | null;
    is_permanent: boolean;
};

type ScheduleStatus = {
    active: boolean;
    next_run: string | null;
    last_run: string | null;
};

type PageProps = {
    configured: boolean;
    remoteConfigured: boolean;
    s3Prefix: string | null;
    retainFull: number;
    backups: BackupRow[];
    schedule: ScheduleStatus | null;
    error: string | null;
    flash?: {
        success?: string;
        error?: string;
    };
};

function formatTimestamp(value: string | null): string {
    if (!value) {
        return '—';
    }

    const parsed = dayjs(value);

    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : value;
}

function formatPgVersion(value: number | null): string {
    if (value === null) {
        return '—';
    }

    const major = Math.floor(value / 10000);

    return `PostgreSQL ${major}`;
}

export default function BackupsPage() {
    const { props } = usePage<PageProps>();
    const [triggeringBackup, setTriggeringBackup] = useState(false);
    const [applyingRetention, setApplyingRetention] = useState(false);

    const handleTriggerBackup = () => {
        if (
            !confirm(
                'Start a manual WAL-G backup on the database server? This may take several minutes.',
            )
        ) {
            return;
        }

        router.post(
            '/admin/settings/backups',
            {},
            {
                preserveScroll: true,
                onBefore: () => setTriggeringBackup(true),
                onSuccess: () => {
                    toast.success(
                        props.flash?.success ??
                            'Backup job started on the database server.',
                    );
                },
                onError: () => {
                    toast.error(
                        props.flash?.error ??
                            'Failed to start backup job. Please try again.',
                    );
                },
                onFinish: () => setTriggeringBackup(false),
            },
        );
    };

    const handleApplyRetention = () => {
        if (
            !confirm(
                `Apply retention policy and keep only the latest ${props.retainFull} full backups?`,
            )
        ) {
            return;
        }

        router.post(
            '/admin/settings/backups/apply-retention',
            {},
            {
                preserveScroll: true,
                onBefore: () => setApplyingRetention(true),
                onSuccess: () => {
                    toast.success(
                        props.flash?.success ??
                            'Backup retention policy applied successfully.',
                    );
                },
                onError: () => {
                    toast.error(
                        props.flash?.error ??
                            'Failed to apply retention policy. Please try again.',
                    );
                },
                onFinish: () => setApplyingRetention(false),
            },
        );
    };

    return (
        <AdminLayout
            breadcrumb={[
                {
                    title: 'Settings',
                },
                {
                    title: 'Backups',
                },
            ]}
            openMenuIds={['settings']}
            activeMenuIds={['settings.backups']}
        >
            <Head title="Backups" />

            <div className="mx-auto w-full max-w-6xl space-y-4 px-3 pb-20 sm:space-y-6 sm:px-4">
                {props.flash?.success && (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {props.flash.success}
                    </div>
                )}

                {props.flash?.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {props.flash.error}
                    </div>
                )}

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <DatabaseBackup className="h-5 w-5 text-muted-foreground" />
                                <h2 className="font-semibold">
                                    WAL-G Database Backups
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Automated daily backups via WAL-G and systemd.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !props.remoteConfigured || triggeringBackup
                                }
                                onClick={handleTriggerBackup}
                                className="w-full sm:w-auto"
                            >
                                <RefreshCw
                                    className={`mr-2 h-4 w-4 ${triggeringBackup ? 'animate-spin' : ''}`}
                                />
                                {triggeringBackup
                                    ? 'Starting...'
                                    : 'Run Backup Now'}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                disabled={
                                    !props.configured || applyingRetention
                                }
                                onClick={handleApplyRetention}
                                className="w-full sm:w-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {applyingRetention
                                    ? 'Applying...'
                                    : `Retain ${props.retainFull} Full`}
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-6">
                        <div className="rounded-xl border bg-muted/20 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Storage
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {props.s3Prefix ?? 'Not configured'}
                            </p>
                        </div>

                        <div className="rounded-xl border bg-muted/20 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Auto backup timer
                            </p>
                            {props.schedule ? (
                                <div className="mt-1 space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant={
                                                props.schedule.active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {props.schedule.active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <p>
                                        Next run:{' '}
                                        {formatTimestamp(
                                            props.schedule.next_run,
                                        )}
                                    </p>
                                    <p>
                                        Last run:{' '}
                                        {formatTimestamp(
                                            props.schedule.last_run,
                                        )}
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {props.remoteConfigured
                                        ? 'Unable to load timer status.'
                                        : 'Configure DB SSH credentials to view schedule.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {!props.configured && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        WAL-G is not configured. Set WALG_S3_PREFIX and backup
                        credentials in the environment to list backups.
                    </div>
                )}

                {props.error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {props.error}
                    </div>
                )}

                <div className="rounded-2xl border bg-card shadow-sm">
                    <div className="border-b px-4 py-4 sm:px-6">
                        <h3 className="font-semibold">Backup History</h3>
                        <p className="text-sm text-muted-foreground">
                            Full backups stored in object storage by WAL-G.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[720px]">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Backup
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        Host
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        PostgreSQL
                                    </th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">
                                        WAL file
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {props.backups.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            {props.configured
                                                ? 'No backups found.'
                                                : 'Configure WAL-G to view backups.'}
                                        </td>
                                    </tr>
                                ) : (
                                    props.backups.map((backup) => (
                                        <tr
                                            key={backup.name}
                                            className="border-t"
                                        >
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {backup.name}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatTimestamp(backup.time)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {backup.hostname ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {formatPgVersion(
                                                    backup.pg_version,
                                                )}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {backup.wal_file_name ?? '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
