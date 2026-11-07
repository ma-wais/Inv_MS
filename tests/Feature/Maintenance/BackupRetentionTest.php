<?php

namespace Tests\Feature\Maintenance;

use App\Services\Maintenance\DatabaseBackupService;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class BackupRetentionTest extends TestCase
{
    public function test_retention_removes_only_completed_archives_strictly_older_than_seven_days(): void
    {
        Storage::fake('local');
        $this->travelTo(now()->startOfSecond());
        foreach (['backup-old.sql.zip' => 8, 'backup-boundary.sql.zip' => 7, 'backup-recent.sql' => 1, 'backup-unfinished.sql.zip.partial' => 20, 'notes.txt' => 20] as $name => $days) {
            Storage::disk('local')->put('backups/'.$name, 'fixture');
            touch(Storage::disk('local')->path('backups/'.$name), now()->subDays($days)->timestamp);
        }
        $service = app(DatabaseBackupService::class);
        $this->assertSame(['backup-old.sql.zip'], $service->prune(7, true));
        Storage::disk('local')->assertExists('backups/backup-old.sql.zip');
        $this->assertSame(['backup-old.sql.zip'], $service->prune());
        Storage::disk('local')->assertMissing('backups/backup-old.sql.zip');
        foreach (['backup-boundary.sql.zip', 'backup-recent.sql', 'backup-unfinished.sql.zip.partial', 'notes.txt'] as $name) {
            Storage::disk('local')->assertExists('backups/'.$name);
        }
        $this->assertFalse($service->isArchive('../backup-old.sql.zip'));
    }
}
