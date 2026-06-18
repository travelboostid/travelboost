<?php

use App\Models\User;
use App\Services\WalGBackupService;

beforeEach(function () {
    $this->withoutVite();

    $this->admin = User::factory()->create();
    $this->admin->addRole('user:admin');
});

test('admin can view backups page', function () {
    $this->mock(WalGBackupService::class, function ($mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true);
        $mock->shouldReceive('isRemoteConfigured')->andReturn(true);
        $mock->shouldReceive('listBackups')->andReturn([
            [
                'name' => 'LATEST',
                'time' => '2026-06-19T01:00:00Z',
                'wal_file_name' => '000000010000000000000001',
                'hostname' => 'tb-db-dev',
                'pg_version' => 180000,
                'start_lsn' => 123,
                'finish_lsn' => 456,
                'is_permanent' => false,
            ],
        ]);
        $mock->shouldReceive('getScheduleStatus')->andReturn([
            'active' => true,
            'next_run' => '2026-06-20T01:00:00+07:00',
            'last_run' => '2026-06-19T01:00:00+07:00',
        ]);
    });

    $this->actingAs($this->admin)
        ->get('/admin/settings/backups')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/settings/backups/index')
            ->where('configured', true)
            ->where('remoteConfigured', true)
            ->has('backups', 1)
            ->where('backups.0.name', 'LATEST')
            ->where('schedule.active', true));
});

test('guest cannot access backups page', function () {
    $this->get('/admin/settings/backups')
        ->assertRedirect();
});

test('admin can trigger a manual backup', function () {
    $this->mock(WalGBackupService::class, function ($mock) {
        $mock->shouldReceive('isRemoteConfigured')->andReturn(true);
        $mock->shouldReceive('triggerBackup')->once();
    });

    $this->actingAs($this->admin)
        ->post('/admin/settings/backups')
        ->assertRedirect()
        ->assertSessionHas('success');
});

test('admin can apply backup retention policy', function () {
    $this->mock(WalGBackupService::class, function ($mock) {
        $mock->shouldReceive('isConfigured')->andReturn(true);
        $mock->shouldReceive('applyRetention')->once();
    });

    $this->actingAs($this->admin)
        ->post('/admin/settings/backups/apply-retention')
        ->assertRedirect()
        ->assertSessionHas('success');
});
