<?php

namespace App\Services\Maintenance;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

class DatabaseBackupService
{
    public function create(): string
    {
        $connection = DB::connection();
        if ($connection->getDriverName() !== 'mysql') {
            throw new RuntimeException('Database backups require MySQL or MariaDB.');
        }
        $disk = Storage::disk('local');
        $disk->makeDirectory('backups');
        $lock = fopen($disk->path('backups/.backup.lock'), 'c');
        if (! $lock || ! flock($lock, LOCK_EX | LOCK_NB)) {
            if ($lock) {
                fclose($lock);
            }
            throw new RuntimeException('Another database backup is running. Try again after it finishes.');
        }
        $name = 'backup-'.now('UTC')->format('Y-m-d-H-i-s').'-'.Str::lower(Str::random(6)).'.sql';
        $temporary = $disk->path('backups/'.$name.'.partial');
        $stream = null;
        try {
            if ($connection->transactionLevel() > 0) {
                throw new RuntimeException('Start a backup outside a database transaction.');
            }
            $stream = fopen($temporary, 'xb');
            if (! $stream) {
                throw new RuntimeException('Cannot create the backup file.');
            }
            $write = static function (string $text) use ($stream) {
                if (fwrite($stream, $text) !== strlen($text)) {
                    throw new RuntimeException('Backup storage is full or unavailable.');
                }
            };
            $pdo = $connection->getPdo();
            $tables = $connection->select("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
            $views = $connection->select("SHOW FULL TABLES WHERE Table_type = 'VIEW'");
            if ($views !== []) {
                throw new RuntimeException('This application backup does not support database views. Use the hosting database backup tool.');
            }
            $sqlMode = $connection->selectOne('SELECT @@SESSION.sql_mode as mode')->mode;
            $write("-- Ventory application database backup\n-- UTC: ".now('UTC')->toIso8601String()."\nSET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS;\nSET FOREIGN_KEY_CHECKS=0;\nSET @OLD_SQL_MODE=@@SQL_MODE;\nSET SQL_MODE=".$pdo->quote($sqlMode).";\nSET NAMES utf8mb4;\n\n");
            $connection->statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            $connection->beginTransaction();
            try {
                foreach ($tables as $table) {
                    $tableName = (string) array_values((array) $table)[0];
                    $quoted = '`'.str_replace('`', '``', $tableName).'`';
                    $schema = $connection->selectOne("SHOW CREATE TABLE {$quoted}");
                    $write("DROP TABLE IF EXISTS {$quoted};\n".((array) $schema)['Create Table'].";\n");
                    $columns = collect($connection->select("SHOW COLUMNS FROM {$quoted}"))
                        ->reject(fn ($column) => str_contains(strtoupper($column->Extra), 'GENERATED'))->pluck('Field')->all();
                    $columnSql = implode(', ', array_map(fn ($column) => '`'.str_replace('`', '``', $column).'`', $columns));
                    $emit = function ($rows) use ($write, $pdo, $quoted, $columnSql) {
                        foreach ($rows as $row) {
                            $values = array_map(fn ($value) => $value === null ? 'NULL' : $pdo->quote((string) $value), array_values((array) $row));
                            $write("INSERT INTO {$quoted} ({$columnSql}) VALUES (".implode(', ', $values).");\n");
                        }
                    };
                    $query = $connection->table($tableName)->select($columns);
                    if (in_array('id', $columns, true)) {
                        $query->chunkById(500, $emit);
                    } else {
                        foreach ($columns as $column) {
                            $query->orderBy($column);
                        }
                        $query->chunk(500, $emit);
                    }
                    $write("\n");
                }
                $connection->commit();
            } catch (Throwable $exception) {
                $connection->rollBack();
                throw $exception;
            }
            $write("SET SQL_MODE=@OLD_SQL_MODE;\nSET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;\n");
            fclose($stream);
            $stream = null;
            $archive = new ZipArchive;
            $archivePath = $disk->path('backups/'.$name.'.zip.partial');
            if ($archive->open($archivePath, ZipArchive::CREATE | ZipArchive::EXCL) !== true) {
                throw new RuntimeException('Cannot create the backup archive.');
            }
            if (! $archive->addFile($temporary, $name) || ! $archive->close()) {
                throw new RuntimeException('Cannot finish the backup archive.');
            }
            $finalName = $name.'.zip';
            if (! rename($archivePath, $disk->path('backups/'.$finalName))) {
                throw new RuntimeException('Cannot publish the completed backup.');
            }

            return $finalName;
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
            if (is_file($temporary)) {
                unlink($temporary);
            }
            if (isset($archivePath) && is_file($archivePath)) {
                unlink($archivePath);
            }
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    public function files(): array
    {
        $disk = Storage::disk('local');

        return collect($disk->files('backups'))->filter(fn ($path) => $this->isArchive(basename($path)))
            ->map(fn ($path) => ['filename' => basename($path), 'size' => round($disk->size($path) / 1048576, 2).' MB',
                'created_at' => gmdate('Y-m-d H:i:s', $disk->lastModified($path)), 'modified' => $disk->lastModified($path)])
            ->sortByDesc('modified')->values()->all();
    }

    public function prune(int $days = 7, bool $dryRun = false): array
    {
        if ($days < 1) {
            throw new RuntimeException('Retention must be at least one day.');
        }
        $disk = Storage::disk('local');
        $cutoff = now()->subDays($days)->timestamp;
        $deleted = [];
        foreach ($this->files() as $file) {
            if ($file['modified'] < $cutoff) {
                if (! $dryRun && ! $disk->delete('backups/'.$file['filename'])) {
                    throw new RuntimeException('Could not delete an expired backup.');
                }
                $deleted[] = $file['filename'];
            }
        }

        return $deleted;
    }

    public function isArchive(string $name): bool
    {
        return preg_match('/\A(?:backup-[\w-]+|full_backup_\d{8}_\d{6})\.sql(?:\.zip)?\z/', $name) === 1;
    }
}
