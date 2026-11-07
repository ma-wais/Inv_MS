<?php

namespace App\Console\Commands;

use App\Services\Maintenance\DatabaseBackupService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class BackupDatabase extends Command
{
    protected $signature = 'ventory:backup {--prune : Remove completed backups older than seven days after a successful backup}';

    protected $description = 'Create a compressed full application database backup in private storage';

    public function handle(DatabaseBackupService $backups): int
    {
        try {
            $filename = $backups->create();
            $deleted = $this->option('prune') ? $backups->prune((int) config('backups.retention_days')) : [];
            $this->info('Backup saved: '.Storage::disk('local')->path('backups/'.$filename));
            $this->info('Expired backups removed: '.count($deleted));
            Log::info('Database backup completed', ['filename' => $filename, 'pruned' => count($deleted)]);

            return self::SUCCESS;
        } catch (Throwable $exception) {
            Log::error('Database backup failed', ['error' => $exception->getMessage()]);
            $this->error('Backup failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
