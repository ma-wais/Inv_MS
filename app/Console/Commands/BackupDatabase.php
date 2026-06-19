<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BackupDatabase extends Command
{
    protected $signature = 'ventory:backup';
    protected $description = 'Backs up the database to a SQL file stored in storage/app/backups';

    public function handle(): int
    {
        $this->info('Starting database backup...');

        $dbConnection = config('database.default');
        
        if ($dbConnection !== 'mysql') {
            $this->error('Backup is only supported for MySQL database connections.');
            return 1;
        }

        $database = config('database.connections.mysql.database');
        
        try {
            $tables = DB::select('SHOW TABLES');
            $key = 'Tables_in_' . $database;

            $sqlDump = "-- Ventory Database Backup\n";
            $sqlDump .= "-- Generated: " . now()->toDateTimeString() . "\n";
            $sqlDump .= "-- Database: {$database}\n\n";
            $sqlDump .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

            foreach ($tables as $table) {
                $tableName = $table->$key;
                
                $this->info("Dumping table structure: {$tableName}");
                
                // Get Create Table structure
                $createStatement = DB::select("SHOW CREATE TABLE `{$tableName}`");
                $sqlDump .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
                $sqlDump .= $createStatement[0]->{'Create Table'} . ";\n\n";

                // Get Table rows
                $rows = DB::table($tableName)->get();
                if ($rows->isNotEmpty()) {
                    $this->info("Dumping table data: {$tableName} (" . $rows->count() . " rows)");
                    foreach ($rows as $row) {
                        $rowArray = (array)$row;
                        $columns = array_keys($rowArray);
                        $escapedColumns = array_map(fn($col) => "`{$col}`", $columns);
                        
                        $values = array_map(function($val) {
                            if ($val === null) return 'NULL';
                            return "'" . addslashes($val) . "'";
                        }, array_values($rowArray));

                        $sqlDump .= "INSERT INTO `{$tableName}` (" . implode(', ', $escapedColumns) . ") VALUES (" . implode(', ', $values) . ");\n";
                    }
                    $sqlDump .= "\n";
                }
            }

            $sqlDump .= "SET FOREIGN_KEY_CHECKS=1;\n";

            $filename = 'backups/backup-' . now()->format('Y-m-d-H-i-s') . '.sql';
            Storage::disk('local')->put($filename, $sqlDump);

            $path = Storage::disk('local')->path($filename);
            $this->info("Backup completed successfully! Saved to: {$path}");
            
            return 0;

        } catch (\Exception $e) {
            $this->error('Backup failed: ' . $e->getMessage());
            return 1;
        }
    }
}
