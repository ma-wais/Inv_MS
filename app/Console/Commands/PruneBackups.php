<?php

namespace App\Console\Commands;

use App\Services\Maintenance\DatabaseBackupService;
use Illuminate\Console\Command;
use Throwable;

class PruneBackups extends Command
{
    protected $signature = 'ventory:backups-prune {--dry-run : List expired archives without deleting them}';

    protected $description = 'Remove completed private database backups older than seven days';

    public function handle(DatabaseBackupService $backups): int
    {
        try {
            $files = $backups->prune((int) config('backups.retention_days'), (bool) $this->option('dry-run'));
            foreach ($files as $file) {
                $this->line($file);
            }
            $this->info(count($files).' expired backup(s) '.($this->option('dry-run') ? 'would be removed.' : 'removed.'));

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }
    }
}
